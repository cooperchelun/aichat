'use strict';

module.exports = async (req, res) => {
  // 檢查是不是 Dialogflow 傳來的 POST 請求
  if (req.method === 'POST') {
    
    // 這裡就是我們要回傳給 LINE 的原神訊息
    const replyMsg = `【原神最新兌換碼情報】\n\n` +
                     `1. 🎁 CA3BLB86MCRJ (原石x60)\n` +
                     `2. 🎁 GDAJBZ55M83R (摩拉x10000)\n\n` +
                     `👉 這是從 Vercel 完美復活送出的回應喔！`;

    // 用最標準的 JSON 格式直接回傳給 Dialogflow，繞過所有套件的 Bug！
    return res.status(200).json({
      fulfillmentMessages: [
        {
          text: {
            text: [replyMsg]
          }
        }
      ]
    });
  } else {
    return res.status(405).send('Method Not Allowed');
  }
};
