'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // 獲取 Dialogflow 傳過來的 User 輸入文字
      const userMessage = (req.body.queryResult && req.body.queryResult.queryText) || '';
      
      let replyMsg = '';

      // 功能一：當使用者輸入包含「兌換碼」
      if (userMessage.includes('兌換碼') || userMessage.toLowerCase().includes('code')) {
        
        // 關鍵修正：加上 headers 偽裝成瀏覽器連線，防止被 GitHub 拒絕連線
        const response = await fetch('https://raw.githubusercontent.com/itskofis/genshin-impact-codes/main/codes.json', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        if (!response.ok) throw new Error(`連線失敗(狀態碼:${response.status})`);
        
        const data = await response.json();
        const activeCodes = Array.isArray(data) ? data : (data.codes || []);

        replyMsg = `【原神最新即時兌換碼】\n\n`;
        if (activeCodes.length === 0) {
          replyMsg += `😭 目前網路上暫時沒有可用的新活動兌換碼喔！\n官方長期序號：GENSHINGIFT (原石x50)`;
        } else {
          activeCodes.forEach((item, index) => {
            const code = item.code || item.promocode;
            const reward = item.reward || item.rewards || item.description || '點擊複製獎勵';
            replyMsg += `${index + 1}. 🎁 ${code}\n   👉 獎勵：${reward}\n\n`;
          });
          replyMsg += `👉 以上是目前為您抓取的全網即時有效序號列表。`;
        }
      } 
      // 功能二：當使用者單純輸入「原神」
      else if (userMessage.includes('原神')) {
        replyMsg = `【原神目前版本情報】\n\n` +
                   `🎮 目前最新版本：v4.7「安固祥刑之儀」\n` +
                   `✨ 當前限時活動：克洛琳德、艾爾海森、希格雯登場！\n\n` +
                   `💡 提示：如果您想查詢序號，請對我輸入【兌換碼】三個字，我就會幫你啟動網路爬蟲喔！`;
      } 
      // 其他預設狀況
      else {
        replyMsg = `您好！我是原神小助手。輸入【原神】可以看當前版本，輸入【兌換碼】可以幫您爬取最新序號喔！`;
      }

      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [replyMsg] } }]
      });

    } catch (error) {
      console.error(error);
      
      // 終極保底：萬一 GitHub 真的完全連不上，直接吐出固定訊息，不讓 LINE 報錯
      const backupMsg = userMessage.includes('兌換碼') 
        ? `【原神最新兌換碼】\n\n1. 🎁 GENSHINGIFT (原石x50)\n\n⚠️ 提示：數據庫連線稍慢，已先為您奉上官方長期有效序號！`
        : `【原神目前版本情報】\n\n🎮 目前最新版本：v4.7\n\n💡 輸入【兌換碼】可以查詢最新的原石序號喔！`;

      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [backupMsg] } }]
      });
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
};
