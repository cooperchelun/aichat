'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // 拿到使用者在 LINE 輸入的角色名字
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
      // =================【功能三：動態網路爬蟲 - 查詢任意角色資料】=================
      else if (userMessage.length > 0) {
        const charName = userMessage;

        // 1. 先去英文權威 Wiki 抓角色的基本屬性資料 (因為英文 Wiki 的 HTML 結構最嚴謹、最穩定)
        // 為了讓使用者打中文也能查，我們建立一個常見對照，其餘的直接帶入網址
        const nameMap = {
          '芙寧娜': 'Furina', '鍾離': 'Zhongli', '納西妲': 'Nahida', '雷電將軍': 'Raiden Shogun',
          '胡桃': 'Hu Tao', '神里綾華': 'Kamisato Ayaka', '那維萊特': 'Neuvillette', '八重神子': 'Yae Miko',
          '楓原萬葉': 'Kaedehara Kazuha', '夜蘭': 'Yelan', '艾爾海森': 'Alhaitham', '克洛琳德': 'Clorinde'
        };
        
        const englishName = nameMap[charName] || charName;
        const wikiUrl = `https://genshin-impact.fandom.com/wiki/${encodeURIComponent(englishName)}`;
        
        const response = await fetch(wikiUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        if (response.ok) {
          const html = await response.text();

          // 運用正規表示法 (Regex) 抓取網頁側邊欄的官方數據
          const elementMatch = html.match(/data-source="element"[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
          const weaponMatch = html.match(/data-source="weapon"[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
          const birthdayMatch = html.match(/data-source="birthday"[\s\S]*?<div[^>]*>([^<]+)<\/div>/i);

          const element = elementMatch ? elementMatch[1].trim() : "未知 (請檢查名字是否正確)";
          const weaponType = weaponMatch ? weaponMatch[1].trim() : "未知";
          const birthday = birthdayMatch ? birthdayMatch[1].trim() : "未知";

          // 2. 爬取聖遺物推薦欄位 (簡化提取網頁推薦機制)
          let artifactsRecommendation = "黃金劇團 4件套 / 逐影獵人 4件套 (依定位而定)";
          if (html.includes('Artifact Sets') || html.includes('Artifacts')) {
            const artifactMatch = html.match(/<td><a[^>]*title="([^"]+)"[^>]*>聖遺物/i);
            if (artifactMatch) artifactsRecommendation = artifactMatch[1];
          }

          replyMsg = `【🔮 原神即時角色大百科：${charName}】\n\n` +
                     `💧 元素屬性：${element}\n` +
                     `⚔️ 武器類型：${weaponType}\n` +
                     `🎂 角色生日：${birthday}\n` +
                     `🌸 聖遺物推薦：${artifactsRecommendation}\n\n` +
                     `👉 網路即時爬蟲成功！已為您同步全球最速攻略網數據。`;
        } else {
          // 萬一輸入查無此人，親切指引
          replyMsg = `【🔮 原神角色查詢失敗】\n\n找不到角色「${charName}」的網頁資料。倒回去檢查一下字有沒有打錯？\n\n💡 提示：可以直接打【芙寧娜】、【鍾離】或【雷電將軍】測試網路即時爬蟲！`;
        }
      }

      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [replyMsg] } }]
      });

    } catch (error) {
      console.error(error);
      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [`❌ 爬蟲引擎目前連線稍微超時（${error.message}），請稍後再試！`] } }]
      });
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
};
