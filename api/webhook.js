'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // 拿到使用者在 LINE 輸入的文字
      const userMessage = (req.body.queryResult && req.body.queryResult.queryText) || '';
      
      let replyMsg = '';

      // 狀況 A：如果使用者輸入的字裡面有包含「兌換」或「碼」或「code」
      if (userMessage.includes('兌換') || userMessage.includes('碼') || userMessage.toLowerCase().includes('code')) {
        
        // 執行網路爬蟲抓序號
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
            const reward = item.reward || item.rewards || item.description || '點擊複製';
            replyMsg += `${index + 1}. 🎁 ${code}\n   👉 獎勵：${reward}\n\n`;
          });
          replyMsg += `👉 以上是為您抓取的全網即時有效序號。`;
        }
      } 
      // 狀況 B：如果使用者輸入的字裡面有「原神」（且沒有提到兌換碼）
      else if (userMessage.includes('原神')) {
        // 顯示你指定的當前最新官方版本情報
        replyMsg = `【原神目前版本情報】\n\n` +
                   `🎮 目前最新版本：v4.7「安固祥刑之儀」\n` +
                   `✨ 當前限時活動：克洛琳德、艾爾海森、希格雯登場！\n\n` +
                   `💡 提示：如果您想查詢序號，請對我輸入【兌換碼】喔！`;
      } 
      // 狀況 C：使用者輸入其他不相關的字
      else {
        replyMsg = `您好！我是原神小助手。\n輸入【原神】可以看當前官方版本情報。\n輸入【兌換碼】可以幫您即時爬取最新序號喔！`;
      }

      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [replyMsg] } }]
      });

    } catch (error) {
      console.error(error);
      // 萬一網路卡住的保底
      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [`❌ 系統稍微卡住了（${error.message}），請稍後再試！`] } }]
      });
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
};
