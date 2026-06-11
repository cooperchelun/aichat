const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// 處理 LINE 的驗證
module.exports = async (req, res) => {
  // 如果收到的是來自 LINE 的 Webhook 驗證 (測試連線時會用到)
  if (req.body.events && req.body.events.length === 0) {
    return res.status(200).send('OK');
  }

  // 原有的 Dialogflow 邏輯放在這裡
  try {
     // ... 你的原有程式碼 ...
     // 記得將 return res.json(...) 保持為 Dialogflow 的格式
  } catch (e) {
     // ...
  }
};
