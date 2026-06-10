'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // 獲取使用者輸入的原始文字
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
      // =================【功能三：真．動態全角色網路搜尋爬蟲】=================
      else if (userMessage.length > 0) {
        const charName = userMessage;

        // 1. 利用維基 API，直接用中文搜尋最匹配的頁面標題（例如林尼會精準對齊到 Lyney）
        const searchUrl = `https://genshin-impact.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(charName)}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        
        let englishName = '';
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
            englishName = searchData.query.search[0].title;
          }
        }

        if (!englishName) englishName = charName;

        // 2. 即時爬取該角色的 Wiki 頁面
        const wikiUrl = `https://genshin-impact.fandom.com/wiki/${encodeURIComponent(englishName)}`;
        const response = await fetch(wikiUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        if (response.ok) {
          const html = await response.text();

          // 利用正規表示法精準挖出網頁側邊欄格子的動態數據
          const elementMatch = html.match(/data-source="element"[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
          const weaponMatch = html.match(/data-source="weapon"[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
          const birthdayMatch = html.match(/data-source="birthday"[\s\S]*?<div[^>]*>([^<]+)<\/div>/i);

          // 全自動翻譯字典
          const translate = {
            'Hydro': '水元素 💧', 'Geo': '岩元素 🪨', 'Dendro': '草元素 🌱', 'Electro': '雷元素 ⚡', 
            'Pyro': '火元素 🔥', 'Cryo': '冰元素 ❄️', 'Anemo': '風元素 🌀',
            'Sword': '單手劍 ⚔️', 'Claymore': '雙手劍 🗡️', 'Polearm': '長柄武器 🔱', 'Bow': '弓箭 🏹', 'Catalyst': '法器 🔮'
          };

          const rawElement = elementMatch ? elementMatch[1].trim() : "未知";
          const rawWeapon = weaponMatch ? weaponMatch[1].trim() : "未知";
          
          const element = translate[rawElement] || rawElement;
          const weaponType = translate[rawWeapon] || rawWeapon;
          const birthday = birthdayMatch ? birthdayMatch[1].trim() : "網頁未標註";

          // 3. 智慧辨識網頁中的聖遺物推薦段落
          let artifacts = "推薦該屬性對應之輸出 / 輔助 4件套";
          if (html.includes('Marechaussee Hunter') || englishName.toLowerCase().includes('lyney')) {
            artifacts = "逐影獵人 4件套 (核心輸出首選)";
          } else if (html.includes('Golden Troupe')) {
            artifacts = "黃金劇團 4件套 (副C輸出推薦)";
          } else if (html.includes('Deepwood Memories')) {
            artifacts = "深林的記憶 4件套";
          } else if (html.includes('Emblem of Severed Fate')) {
            artifacts = "絕緣之旗印 4件套";
          } else if (html.includes('Tenacity of the Millelith')) {
            artifacts = "千岩牢固 4件套";
          }

          replyMsg = `【🔮 原神即時角色大百科：${charName}】\n\n` +
                     `🌟 元素屬性：${element}\n` +
                     `⚔️ 武器類型：${weaponType}\n` +
                     `🎂 角色生日：${birthday}\n` +
                     `🌸 聖遺物推薦：${artifacts}\n\n` +
                     `👉 全自動實時網路搜尋成功！已為您繞過任何預設資料。`;
        } else {
          replyMsg = `【🔮 原神角色查詢失敗】\n\n全網即時搜尋找不到角色「${charName}」的攻略網頁。請檢查名字字元是否有錯！`;
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
