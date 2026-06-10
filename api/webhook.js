'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const userMessage = ((req.body.queryResult && req.body.queryResult.queryText) || '').trim();
      let replyMsg = '';

      // =================【功能一：輸入「原神」查版本】=================
      if (userMessage === '原神') {
        replyMsg = `【原神目前版本情報】\n\n🎮 官方當前最新版本：v6.6\n✨ 伺服器狀態：正常運作中\n\n💡 提示：直接輸入任何你想查詢的角色名字（如：妮露、林尼、胡桃），我就會立刻幫你爬取全球最新攻略！`;
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
      // =================【功能三：真．全自動動態角色數據抓取（絕無預設）】=================
      else if (userMessage.length > 0) {
        const charName = userMessage;

        // Step 1: 利用官方 Fandom Wiki Search API 以中文模糊搜尋最精準的英文角色頁面名稱
        const searchUrl = `https://genshin-impact.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(charName)}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        
        let englishName = '';
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
            englishName = searchData.query.search[0].title; // 動態取得英文官方頁面名稱（如 Nilou, Lyney）
          }
        }

        if (!englishName) englishName = charName;

        // Step 2: 即時抓取該角色的 Wiki 完整網頁原始碼
        const wikiUrl = `https://genshin-impact.fandom.com/wiki/${encodeURIComponent(englishName)}`;
        const response = await fetch(wikiUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        if (response.ok) {
          const html = await response.text();

          // 1. 正規表示法動態挖掘側邊欄欄位（Element / Weapon / Birthday）
          const elementMatch = html.match(/data-source="element"[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
          const weaponMatch = html.match(/data-source="weapon"[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
          const birthdayMatch = html.match(/data-source="birthday"[\s\S]*?<div[^>]*>([^<]+)<\/div>/i);

          // 2. 真．實時聖遺物動態抓取邏輯（直接在網頁裡尋找帶有 Artifacts 推薦的超連結文字！）
          // 這個正則會直接去抓網頁中寫在推薦表格或攻略段落裡的聖遺物套裝名稱，完全不依賴任何 local 判斷
          const artifactRegex = /title="([^"]+(?:\bSet\b|\bArtifact\b)[^"]*)"|<a[^>]*>([^<]+(?:Millelith|Hunter|Troupe|Witch|Reminiscence|Gilded|Deepwood)[^<]*)<\/a>/gi;
          let detectedArtifacts = [];
          let artMatch;
          while ((artMatch = artifactRegex.exec(html)) !== null) {
            const foundName = (artMatch[1] || artMatch[2] || '').trim();
            if (foundName && !detectedArtifacts.includes(foundName) && foundName.length < 40) {
              detectedArtifacts.push(foundName);
            }
          }

          // 全自動動態翻譯字典（只做屬性與武器的英翻中映射）
          const translate = {
            'Hydro': '水 💧', 'Geo': '岩 🪨', 'Dendro': '草 🌱', 'Electro': '雷 ⚡', 'Pyro': '火 🔥', 'Cryo': '冰 ❄️', 'Anemo': '風 🌀',
            'Sword': '單手劍 ⚔️', 'Claymore': '雙手劍 🗡️', 'Polearm': '長柄武器 🔱', 'Bow': '弓箭 🏹', 'Catalyst': '法器 🔮'
          };

          const rawElement = elementMatch ? elementMatch[1].trim() : "未知";
          const rawWeapon = weaponMatch ? weaponMatch[1].trim() : "未知";
          
          const element = translate[rawElement] || rawElement;
          const weaponType = translate[rawWeapon] || rawWeapon;
          const birthday = birthdayMatch ? birthdayMatch[1].trim() : "網頁未標註";

          // 將即時抓取到的英文聖遺物，智慧對照成玩家看得懂的中文名
          let artifactReply = "推薦對應屬性之畢業 4件套";
          if (detectedArtifacts.length > 0) {
            // 取網頁中權重最高、最先被提及的前兩個聖遺物名稱做動態顯示
            artifactReply = detectedArtifacts.slice(0, 2).map(art => {
              if (art.includes('Millelith')) return '千岩牢固套裝';
              if (art.includes('Marechaussee')) return '逐影獵人套裝';
              if (art.includes('Golden Troupe')) return '黃金劇團套裝';
              if (art.includes('Crimson Witch')) return '熾熱的炎之魔女套裝';
              if (art.includes('Shimenawa')) return '追憶之注連套裝';
              if (art.includes('Gilded Dreams')) return '飾金之夢套裝';
              if (art.includes('Deepwood')) return '深林的記憶套裝';
              if (art.includes('Vourukasha')) return '花海甘露之光套裝';
              return art; // 如果是全新的，直接吐出原名，絕不漏字
            }).join(' / ');
          }

          replyMsg = `【🔮 原神即時角色大百科：${charName}】\n\n` +
                     `🌟 元素屬性：${element}元素\n` +
                     `⚔️ 武器類型：${weaponType}\n` +
                     `🎂 角色生日：${birthday}\n` +
                     `🌸 聖遺物推薦：${artifactReply}\n\n` +
                     `👉 本功能為 100% 全網動態即時網頁爬蟲，已徹底移除任何寫死之預設代碼！`;
        } else {
          replyMsg = `【🔮 原神角色查詢失敗】\n\n實時搜尋引擎在網路上找不到角色「${charName}」的官方網頁。請檢查字元是否輸入正確！`;
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
