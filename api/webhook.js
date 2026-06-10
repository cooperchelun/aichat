'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // 獲取 Dialogflow 傳過來的 User 輸入文字，並轉成小寫以利判斷
      const userMessage = (req.body.queryResult && req.body.queryResult.queryText) || '';
      
      let replyMsg = '';

      // 功能一：當使用者輸入「兌換碼」
      if (userMessage.includes('兌換碼') || userMessage.toLowerCase().includes('code')) {
        const response = await fetch('https://raw.githubusercontent.com/itskofis/genshin-impact-codes/main/codes.json');
        if (!response.ok) throw new Error('即時數據庫連線失敗');
        
        const data = await response.json();
        const activeCodes = Array.isArray(data) ? data : (data.codes || []);

        replyMsg = `【原神最新即時兌換碼】\n\n`;
        if (activeCodes.length === 0) {
          replyMsg += `😭 目前剛好處於版本末期，網路上暫時沒有可用的新活動兌換碼喔！\n官方長期序號：GENSHINGIFT (原石x50)`;
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
        // 固定顯示目前最新的原神大版本狀態
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
      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [`❌ 系統連線有些不穩定（${error.message}），請稍後再試！`] } }]
      });
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
};
