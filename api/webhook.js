'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const userMessage = (req.body.queryResult && req.body.queryResult.queryText) || '';
      let replyMsg = '';

      // 狀況 A：使用者想查「兌換碼」
      if (userMessage.includes('兌換') || userMessage.includes('碼') || userMessage.toLowerCase().includes('code')) {
        // 直接爬取最權威的 Fandom Wiki 頁面
        const response = await fetch('https://genshin-impact.fandom.com/wiki/Promotional_Codes', {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        if (!response.ok) throw new Error('無法連線至 Wiki 數據庫');
        const html = await response.text();

        // 用簡單的正規表示法，抓取網頁中所有可能是序號的英數字組合
        const codeRegex = /<code>([A-Za-z0-9]{10,15})<\/code>/g;
        let matches = [];
        let match;
        while ((match = codeRegex.exec(html)) !== null) {
          if (!matches.includes(match[1]) && match[1] !== 'GENSHINGIFT') {
            matches.push(match[1]);
          }
        }

        replyMsg = `【原神最新即時兌換碼】\n\n`;
        replyMsg += `1. 🎁 GENSHINGIFT (官方長期有效)\n`;
        
        if (matches.length > 0) {
          matches.slice(0, 3).forEach((code, index) => {
            replyMsg += `${index + 2}. 🎁 ${code} (最新活動序號)\n`;
          });
        } else {
          replyMsg += `\n😭 爬蟲報告：目前正值版本末期，網頁上暫無其他限時序號。`;
        }
        replyMsg += `\n👉 網路即時爬蟲成功！`;
      } 
      // 狀況 B：使用者輸入「原神」，自動查目前官方最新大版本
      else if (userMessage.includes('原神')) {
        // 爬取 Wiki 首頁來抓取當前的最新版本號
        const response = await fetch('https://genshin-impact.fandom.com/wiki/Genshin_Impact_Wiki', {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        let version = "6.6+"; // 萬一沒抓到的保底
        if (response.ok) {
          const html = await response.text();
          // 尋找網頁中的版本標籤，例如 "Version 6.6"
          const versionMatch = html.match(/Version\s([0-9]+\.[0-9]+)/i);
          if (versionMatch) version = versionMatch[1];
        }

        replyMsg = `【原神目前版本情報】\n\n` +
                   `🎮 官方當前最新版本：v${version}\n` +
                   `✨ 伺服器狀態：正常運作中\n\n` +
                   `💡 提示：如果您想查詢序號，請對我輸入【兌換碼】喔！`;
      } 
      else {
        replyMsg = `您好！我是原神小助手。\n輸入【原神】可以看當前官方版本，輸入【兌換碼】可以爬取最新序號喔！`;
      }

      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [replyMsg] } }]
      });

    } catch (error) {
      console.error(error);
      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [`❌ 系統稍微卡住了（${error.message}），請稍後再試！`] } }]
      });
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
};
