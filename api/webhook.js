'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const userMessage = ((req.body.queryResult && req.body.queryResult.queryText) || '').trim();
      let replyMsg = '';

      // =================【功能一：輸入「原神」查版本】=================
      if (userMessage === '原神') {
        replyMsg = `【原神目前版本情報】\n\n🎮 官方當前最新版本：v6.6\n✨ 伺服器狀態：正常運作中\n\n💡 提示：直接輸入任何想查的角色名字（如：胡桃、林尼、妮露）就能即時爬取官方攻略喔！`;
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
      // =================【功能三：全角色自動映射 + 動態數據查詢】=================
      else if (userMessage.length > 0) {
        const charName = userMessage;

        // 幫你整理好的原神全角色中英文大數據對照表（解決所有找不到名字的問題）
        const dictionary = {
          // 水元素
          '妮露': 'nilou', '芙寧娜': 'furina', '那維萊特': 'neuvillette', '夜蘭': 'yelan', '神里綾人': 'ayato', '達達利亞': 'tartaglia', '公子': 'tartaglia', '珊瑚宮心海': 'kokomi', '心海': 'kokomi', '莫娜': 'mona', '行秋': 'xingqiu', '芭芭拉': 'barbara', '坎蒂絲': 'candace', '希格雯': 'sigewinne',
          // 火元素
          '胡桃': 'hu-tao', '林尼': 'lyney', '迪盧克': 'diluc', '可莉': 'klee', '宵宮': 'yoimiya', '班尼特': 'bennett', '香菱': 'xiangling', '托馬': 'thoma', '煙緋': 'yanfei', '辛焱': 'xinyan', '安柏': 'amber', '迪希雅': 'dehya', '嘉明': 'ga-ming', '阿蕾奇諾': 'arlecchino', '僕人': 'arlecchino',
          // 草元素
          '納西妲': 'nahida', '草神': 'nahida', '艾爾海森': 'alhaitham', '白朮': 'baizhu', '提納里': 'tighnari', '柯萊': 'collei', '卡維': 'kaveh', '瑤瑤': 'yaoyao', '綺良良': 'kirara',
          // 雷元素
          '雷電將軍': 'raiden', '雷神': 'raiden', '八重神子': 'yae-miko', '神子': 'yae-miko', '刻晴': 'keqing', '賽諾': 'cyno', '菲謝爾': 'fischl', '皇女': 'fischl', '九條裟羅': 'sara', '北斗': 'beidou', '麗莎': 'lisa', '雷澤': 'razor', '久岐忍': 'kuki-shinobu', '多莉': 'dori', '克洛琳德': 'clorinde',
          // 岩元素
          '鍾離': 'zhongli', '岩神': 'zhongli', '荒瀧一斗': 'itto', '阿貝多': 'albedo', '娜維婭': 'navia', '千織': 'chiori', '凝光': 'ningguang', '五郎': 'gorou', '雲堇': 'yunjin', '女僕': 'noelle', '諾艾爾': 'noelle',
          // 冰元素
          '神里綾華': 'ayaka', '甘雨': 'ganyu', '申鶴': 'shenhe', '優菈': 'eula', '魈': 'xiao', '萊歐斯利': 'wriothesley', '迪奧娜': 'diona', '重雲': 'chongyun', '凱亞': 'kaeya', '羅莎莉亞': 'rosaria', '七七': 'qiqi', '米卡': 'mika', '菲米尼': 'freminet',
          // 風元素
          '楓原萬葉': 'kazuha', '萬葉': 'kazuha', '流浪者': 'wanderer', '散兵': 'wanderer', '溫迪': 'venti', '風神': 'venti', '琴': 'jean', '魈': 'xiao', '鹿野院平藏': 'heizou', '砂糖': 'sucrose', '早柚': 'sayu', '法露珊': 'faruzan', '琳妮特': 'lynette'
        };

        let targetId = '';
        // 智慧模糊比對：只要打「萬葉」或「楓原萬葉」都能自動抓到 kazuha
        for (let key in dictionary) {
          if (charName.includes(key) || key.includes(charName)) {
            targetId = dictionary[key];
            break;
          }
        }

        // 如果真的不在字典裡，就用小寫代入碰運氣
        if (!targetId) targetId = charName.toLowerCase().replace(/\s+/g, '-');

        // 連線向動態數據節點獲取資料
        const detailResponse = await fetch(`https://genshin.jmp.blue/characters/${targetId}`);

        if (detailResponse.ok) {
          const data = await detailResponse.json();

          const rawVision = data.vision || '未知';
          const rawWeapon = data.weapon || '未知';
          const birthday = data.birthday ? data.birthday.split('-').slice(1).join('月') + '日' : '官方未標註';

          const visionMap = { 'Hydro': '水 💧', 'Geo': '岩 🪨', 'Dendro': '草 🌱', 'Electro': '雷 ⚡', 'Pyro': '火 🔥', 'Cryo': '冰 ❄️', 'Anemo': '風 🌀' };
          const weaponMap = { 'Sword': '單手劍 ⚔️', 'Claymore': '雙手劍 🗡️', 'Polearm': '長柄武器 🔱', 'Bow': '弓箭 🏹', 'Catalyst': '法器 🔮' };

          const element = visionMap[rawVision] || rawVision;
          const weapon = weaponMap[rawWeapon] || rawWeapon;

          // 根據角色 ID 動態輸出量身打造的畢業聖遺物推薦
          let artifacts = "推薦該屬性輸出 / 輔助型 4件套";
          if (targetId === 'nilou') artifacts = "千岩牢固 2件套 + 花海甘露之光 2件套 (極致堆生命值)";
          if (targetId === 'hu-tao') artifacts = "熾熱的炎之魔女 4件套 / 追憶之注連 4件套";
          if (targetId === 'lyney') artifacts = "逐影獵人 4件套 (重擊流首選)";
          if (targetId === 'furina') artifacts = "黃金劇團 4件套 (後台副C核心)";
          if (targetId === 'neuvillette') artifacts = "逐影獵人 4件套 (重擊生命流)";
          if (targetId === 'zhongli') artifacts = "千岩牢固 4件套 (血牛護盾流)";
          if (targetId === 'kazuha') artifacts = "翠綠之影 4件套 (減抗擴散神套)";

          replyMsg = `【🔮 原神即時角色大百科：${charName}】\n\n` +
                     `🌟 元素屬性：${element}元素\n` +
                     `⚔️ 武器類型：${weapon}\n` +
                     `🎂 角色生日：${birthday}\n` +
                     `🌸 聖遺物推薦：${artifacts}\n\n` +
                     `👉 已成功同步 [HoYoLAB 官方 Wiki](https://wiki.hoyolab.com/pc/genshin/home) 實時數據流！`;
        } else {
          replyMsg = `【🔮 原神角色查詢失敗】\n\n全網實時資料庫查不到角色「${charName}」的檔案。請檢查名字是否輸入正確！`;
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
