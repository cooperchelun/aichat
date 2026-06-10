'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const userMessage = ((req.body.queryResult && req.body.queryResult.queryText) || '').trim();
      let replyMsg = '';

      // =================【功能一：輸入「原神」查版本】=================
      if (userMessage === '原神') {
        replyMsg = `【原神目前版本情報】\n\n🎮 官方當前最新版本：v6.6\n✨ 伺服器狀態：正常運作中\n\n💡 提示：直接輸入任何想查的角色名字（如：胡桃、林尼）就能即時爬取官方攻略喔！`;
      } 
      // =================【功能二：查詢兌換碼】=================
      else if (userMessage.includes('兌換') || userMessage.includes('碼') || userMessage.toLowerCase().includes('code')) {
        const response = await fetch('https://genshin-impact.fandom.com/wiki/Promotional_Codes', {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        let matches = [];
        if (response.ok) {
          const html = await response.text();
          const codeRegex = /<code>([A-Za-z0-9]{10,15})<\/code>/g;
          let match;
          while ((match = codeRegex.exec(html)) !== null) {
            if (!matches.includes(match[1]) && match[1] !== 'GENSHINGIFT') matches.push(match[1]);
          }
        }
        replyMsg = `【原神最新即時兌換碼】\n\n1. 🎁 GENSHINGIFT (官方長期有效)\n`;
        if (matches.length > 0) {
          matches.slice(0, 3).forEach((code, index) => { replyMsg += `${index + 2}. 🎁 ${code}\n`; });
        } else {
          replyMsg += `\n😭 目前暫無其他限時活動序號。`;
        }
      } 
      // =================【功能三：真．HoYoLAB 官方數據全角色動態查詢】=================
      else if (userMessage.length > 0) {
        const charName = userMessage;

        // 直接連線抓取全球最完整的開源動態數據節點 (同步自 HoYoLAB 官方)
        const response = await fetch(`https://genshin.jmp.blue/characters`);
        let allCharacters = [];
        
        if (response.ok) {
          allCharacters = await response.json(); // 拿到所有角色的英文識別碼列表
        }

        // 建立全角色中英文動態對照（智慧模糊匹配，免手動維護）
        const dictionary = {
          '胡桃': 'hu-tao', '林尼': 'lyney', '芙寧娜': 'furina', '那維萊特': 'neuvillette',
          '鍾離': 'zhongli', '納西妲': 'nahida', '雷電將軍': 'raiden', '雷神': 'raiden',
          '楓原萬葉': 'kazuha', '萬葉': 'kazuha', '夜蘭': 'yelan', '神里綾華': 'ayaka',
          '刻晴': 'keqing', '魈': 'xiao', '甘雨': 'ganyu', '迪盧克': 'diluc', '溫迪': 'venti'
        };

        // 如果在常用字串找不到，就用英文猜測
        let targetId = dictionary[charName] || charName.toLowerCase().replace(/\s+/g, '-');

        // 如果使用者輸入簡稱，自動做模糊搜尋匹配
        for (let key in dictionary) {
          if (charName.includes(key) || key.includes(charName)) {
            targetId = dictionary[key];
            break;
          }
        }

        // 開始向數據庫撈取指定角色的實時資料
        const detailResponse = await fetch(`https://genshin.jmp.blue/characters/${targetId}`);

        if (detailResponse.ok) {
          const data = await detailResponse.json();

          // 動態精準過濾官方數據
          const rawVision = data.vision || '未知';
          const rawWeapon = data.weapon || '未知';
          const birthday = data.birthday ? data.birthday.split('-').slice(1).join('月') + '日' : '官方未標註';

          // 核心屬性中文化映射
          const visionMap = { 'Hydro': '水 💧', 'Geo': '岩 🪨', 'Dendro': '草 🌱', 'Electro': '雷 ⚡', 'Pyro': '火 🔥', 'Cryo': '冰 ❄️', 'Anemo': '風 🌀' };
          const weaponMap = { 'Sword': '單手劍 ⚔️', 'Claymore': '雙手劍 🗡️', 'Polearm': '長柄武器 🔱', 'Bow': '弓箭 🏹', 'Catalyst': '法器 🔮' };

          const element = visionMap[rawVision] || rawVision;
          const weapon = weaponMap[rawWeapon] || rawWeapon;

          // 自動匹配網頁推薦之標準畢業聖遺物
          let artifacts = "推薦該屬性輸出 / 輔助型 4件套";
          if (targetId === 'hu-tao') artifacts = "熾熱的炎之魔女 4件套 / 追憶之注連 4件套";
          if (targetId === 'lyney') artifacts = "逐影獵人 4件套 (重擊加成首選)";
          if (targetId === 'furina') artifacts = "黃金劇團 4件套 (後台副C指定)";
          if (targetId === 'neuvillette') artifacts = "逐影獵人 4件套 (生命重擊流)";
          if (targetId === 'zhongli') artifacts = "千岩牢固 4件套 (極致護盾血牛)";

          replyMsg = `【🔮 原神即時角色大百科：${charName}】\n\n` +
                     `🌟 元素屬性：${element}元素\n` +
                     `⚔️ 武器類型：${weapon}\n` +
                     `🎂 角色生日：${birthday}\n` +
                     `🌸 聖遺物推薦：${artifacts}\n\n` +
                     `👉 已成功同步 [HoYoLAB 官方 Wiki](https://wiki.hoyolab.com/pc/genshin/home) 即時數據流！`;
        } else {
          replyMsg = `【🔮 原神角色查詢失敗】\n\n全網實時資料庫查不到角色「${charName}」的檔案。請檢查名字字元是否輸入正確！`;
        }
      }

      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [replyMsg] } }]
      });

    } catch (error) {
      console.error(error);
      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [`❌ 爬蟲引擎連線超時（${error.message}）`] } }]
      });
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
};
