'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // 遠端請求即時的外部原神序號 API (由穩定維護的第三方提供)
      const response = await fetch('https://raw.githubusercontent.com/pomelo923/Genshin-Impact-Codes/main/codes.json');
      
      if (!response.ok) throw new Error('無法取得即時序號');
      
      const data = await response.json();
      
      // 篩選出還在有效期限內的序號
      const activeCodes = data.filter(item => item.is_active === true || item.status === 'active');
      
      let replyMsg = `【原神最新即時兌換碼】\n\n`;
      
      if (activeCodes.length === 0) {
        replyMsg += `😭 目前暫時沒有可用的有效兌換碼喔！\n請等官方改版直播時再試試看。`;
      } else {
        activeCodes.forEach((item, index) => {
          // 依據資料結構抓取序號與獎勵內容
          const code = item.code || item.promocode;
          const reward = item.reward || item.rewards || '點擊複製';
          replyMsg += `${index + 1}. 🎁 ${code} (${reward})\n`;
        });
        replyMsg += `\n👉 爬蟲成功！以上是目前網路上最新的即時序號喔！`;
      }

      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [replyMsg] } }]
      });

    } catch (error) {
      console.error(error);
      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [`❌ 糟糕，爬蟲伺服器暫時斷線了，請稍後再試！\n錯誤回報：${error.message}`] } }]
      });
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
};
