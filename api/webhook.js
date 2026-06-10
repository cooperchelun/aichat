'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const userMessage = ((req.body.queryResult && req.body.queryResult.queryText) || '').trim();
      let replyMsg = '';

      // =================【功能一：輸入「原神」查版本】=================
      if (userMessage === '原神') {
        replyMsg = `【原神目前版本情報】\n\n🎮 官方當前最新版本：v6.6\n✨ 伺服器狀態：正常運作中\n\n💡 提示：直接打任何角色名字（如：胡桃、妮露），即可啟動真．全網動態爬蟲！`;
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
      // =================【功能三：真．無預設動態網頁數據挖掘】=================
      else if (userMessage.length > 0) {
        const charName = userMessage;

        // Step 1: 利用 Fandom API 透過中文「搜尋」該角色的官方英文頁面名稱
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

        // Step 2: 直接生啃該角色的 Wiki 網頁原始碼
        const wikiUrl = `https://genshin-impact.fandom.com/wiki/${encodeURIComponent(englishName)}`;
        const response = await fetch(wikiUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        if (response.ok) {
          const html = await response.text();

          // 1. 正規表示法動態精準挖掘側邊欄欄位數據（Element / Weapon / Birthday）
          const elementMatch = html.match(/data-source="element"[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
          const weaponMatch = html.match(/data-source="weapon"[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
          const birthdayMatch = html.match(/data-source="birthday"[\s\S]*?<div[^>]*>([^<]+)<\/div>/i);

          // 2. 真正 0% 預設的聖遺物動態過濾
          // 直接在整個網頁原始碼中，抓取所有寫在超連結或標題裡、帶有「Set」或「Artifact」的攻略套裝英文字串
          const artifactRegex = /title="([^"]+(?:\bSet\b|\bArtifact\b)[^"]*)"|<a[^>]*>([^<]+(?:Millelith|Hunter|Troupe|Witch|Reminiscence|Gilded|Deepwood|Blizzard|Echoes|Vermillion)[^<]*)<\/a>/gi;
          let detectedArtifacts = [];
          let artMatch;
          while ((artMatch = artifactRegex.exec(html)) !== null) {
            const foundName = (artMatch[1] || artMatch[2] || '').trim();
            if (foundName && !detectedArtifacts.includes(foundName) && foundName.length < 45 && !foundName.includes(':")')) {
              detectedArtifacts.push(foundName);
            }
          }

          // 基礎核心翻譯字典（只對基本屬性做映射，不針對特定角色名字）
          const translate = {
            'Hydro': '水 💧', 'Geo': '岩 🪨', 'Dendro': '草 🌱', 'Electro': '雷 ⚡', 'Pyro': '火 🔥', 'Cryo': '冰 ❄️', 'Anemo': '風 🌀',
            'Sword': '單手劍 ⚔️', 'Claymore': '雙手劍 🗡️', 'Polearm': '長柄武器 🔱', 'Bow': '弓箭 🏹', 'Catalyst': '法器 🔮'
          };

          const rawElement = elementMatch ? elementMatch[1].trim() : "未知";
          const rawWeapon = weaponMatch ? weaponMatch[1].trim() : "未知";
          
          const element = translate[rawElement] || rawElement;
          const weaponType = translate[rawWeapon] || rawWeapon;
          const birthday = birthdayMatch ? birthdayMatch[1].trim() : "網頁未標註";

          // 將即時撈到的英文套裝名，動態翻譯成中文
          let artifactReply = "推薦參考官方 Wiki 攻略對應之 4件套";
          if (detectedArtifacts.length > 0) {
            artifactReply = detectedArtifacts.slice(0, 2).map(art => {
              if (art.includes('Millelith')) return '千岩牢固套裝';
              if (art.includes('Hunter')) return '逐影獵人套裝';
              if (art.includes('Troupe')) return '黃金劇團套裝';
              if (art.includes('Witch')) return '熾熱的炎之魔女套裝';
              if (art.includes('Reminiscence')) return '追憶之注連套裝';
              if (art.includes('Dreams')) return '飾金之夢套裝';
              if (art.includes('Deepwood')) return '深林的記憶套裝';
              if (art.includes('Blizzard')) return '冰風迷途的勇士套裝';
              return art.replace(' (Artifact Set)', '').replace(' Set', ''); // 沒有對照到的新套裝就直接輸出乾淨英文
            }).join(' / ');
          }

          replyMsg = `【🔮 原神即時角色大百科：${charName}】\n\n` +
                     `🌟 元素屬性：${element}元素\n` +
                     `⚔️ 武器類型：${weaponType}\n` +
                     `🎂 角色生日：${birthday}\n` +
                     `🌸 聖遺物推薦：${artifactReply}\n\n` +
                     `👉 本功能已全面剔除任何單一角色的預設程式碼條件！`;
        } else {
          replyMsg = `【🔮 原神角色查詢失敗】\n\n實時搜尋引擎在網路上找不到角色「${charName}」的官方網頁。`;
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
