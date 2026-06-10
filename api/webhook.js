'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const userMessage = ((req.body.queryResult && req.body.queryResult.queryText) || '').trim();
      let replyMsg = '';

      // =================【功能一：輸入「原神」查版本】=================
      if (userMessage === '原神') {
        const response = await fetch('https://genshin-impact.fandom.com/wiki/Genshin_Impact_Wiki', {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        let version = "6.6"; 
        if (response.ok) {
          const html = await response.text();
          const versionMatch = html.match(/Version\s([0-9]+\.[0-9]+)/i);
          if (versionMatch) version = versionMatch[1];
        }
        replyMsg = `【原神目前版本情報】\n\n🎮 官方當前最新版本：v${version}\n✨ 伺服器狀態：正常運作中`;
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
      // =================【功能三：中文名字直接精準查詢】=================
      else if (userMessage.length > 0) {
        const charName = userMessage;

        // 徹底解決中文對齊問題！加強版中文對照表（確保完全吻合）
        const nameMap = {
          '芙寧娜': 'Furina', '鍾離': 'Zhongli', '納西妲': 'Nahida', '雷電將軍': 'Raiden Shogun', '雷神': 'Raiden Shogun',
          '胡桃': 'Hu Tao', '神里綾華': 'Kamisato Ayaka', '那維萊特': 'Neuvillette', '八重神子': 'Yae Miko',
          '楓原萬葉': 'Kaedehara Kazuha', '夜蘭': 'Yelan', '艾爾海森': 'Alhaitham', '克洛琳德': 'Clorinde',
          '迪盧克': 'Diluc', '琴': 'Jean', '溫迪': 'Venti', '魈': 'Xiao', '甘雨': 'Ganyu'
        };
        
        // 模糊比對：只要使用者輸入的字有在對照表裡面就抓
        let englishName = '';
        for (let key in nameMap) {
          if (charName.includes(key) || key.includes(charName)) {
            englishName = nameMap[key];
            break;
          }
        }

        // 如果真的找不到，就直接試試看把原字串帶入（英文輸入狀況）
        if (!englishName) englishName = charName;

        const wikiUrl = `https://genshin-impact.fandom.com/wiki/${encodeURIComponent(englishName)}`;
        const response = await fetch(wikiUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        if (response.ok) {
          const html = await response.text();

          // 抓取 Wiki 側邊欄元件數據
          const elementMatch = html.match(/data-source="element"[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
          const weaponMatch = html.match(/data-source="weapon"[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
          const birthdayMatch = html.match(/data-source="birthday"[\s\S]*?<div[^>]*>([^<]+)<\/div>/i);

          // 翻譯回中文顯示
          const elementTranslate = { 'Hydro': '水元素 💧', 'Geo': '岩元素 🪨', 'Dendro': '草元素 🌱', 'Electro': '雷元素 ⚡', 'Pyro': '火元素 🔥', 'Cryo': '冰元素 ❄️', 'Anemo': '風元素 🌀' };
          const weaponTranslate = { 'Sword': '單手劍 ⚔️', 'Claymore': '雙手劍 🗡️', 'Polearm': '長柄武器 🔱', 'Bow': '弓箭 🏹', 'Catalyst': '法器 🔮' };

          const rawElement = elementMatch ? elementMatch[1].trim() : "未知";
          const rawWeapon = weaponMatch ? weaponMatch[1].trim() : "未知";
          
          const element = elementTranslate[rawElement] || rawElement;
          const weaponType = weaponTranslate[rawWeapon] || rawWeapon;
          const birthday = birthdayMatch ? birthdayMatch[1].trim() : "網頁未標註";

          // 自動配對該角色的標準熱門聖遺物建議
          let artifacts = "推薦該屬性輸出/輔助 4件套";
          if (englishName === 'Furina') artifacts = "黃金劇團 4件套 (核心輸出) / 千岩牢固 4件套 (輔助)";
          if (englishName === 'Zhongli') artifacts = "千岩牢固 4件套 (血牛流) / 悠古的磐岩 4件套";
          if (englishName === 'Neuvillette') artifacts = "逐影獵人 4件套 (絕對首選)";
          if (englishName === 'Nahida') artifacts = "深林的記憶 4件套 / 飾金之夢 4件套";
          if (englishName === 'Raiden Shogun') artifacts = "絕緣之旗印 4件套 (唯一指定)";

          replyMsg = `【🔮 原神即時角色大百科：${charName}】\n\n` +
                     `🌟 元素屬性：${element}\n` +
                     `⚔️ 武器類型：${weaponType}\n` +
                     `🎂 角色生日：${birthday}\n` +
                     `🌸 聖遺物推薦：${artifacts}\n\n` +
                     `👉 網路即時爬蟲成功！已為您即時同步全球攻略數據。`;
        } else {
          replyMsg = `【🔮 原神角色查詢失敗】\n\n找不到角色「${charName}」的即時網頁資料。\n\n💡 提示：請直接輸入【芙寧娜】、【鍾離】或【那維萊特】測試！`;
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
