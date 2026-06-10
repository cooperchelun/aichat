const line = require("@line/bot-sdk");
const axios = require("axios");

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(config);

module.exports = async (req, res) => {
  try {
    // 1. 安全解析 body，避免 Vercel 環境導致的 JSON 解析錯誤
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    
    // 2. 確認是否有事件
    if (!body?.events || body.events.length === 0) {
      return res.status(200).send("OK");
    }

    const event = body.events[0];
    if (event.type !== "message" || event.message.type !== "text") {
      return res.status(200).send("OK");
    }

    const userMessage = event.message.text.trim();
    let replyText = "";

    // 3. 嘗試查詢資料
    try {
      const response = await axios.get("https://genshin.jmp.blue/characters");
      const characters = response.data;
      
      const found = characters.find(c => c.toLowerCase() === userMessage.toLowerCase());

      if (!found) {
        replyText = "找不到角色，請輸入正確的英文名稱 (例如: furina, hutao)";
      } else {
        const detail = await axios.get(`https://genshin.jmp.blue/characters/${found}`);
        const data = detail.data;
        replyText = `角色：${data.name}\n元素：${data.vision}\n武器：${data.weapon}\n稀有度：${data.rarity}★`;
      }
    } catch (apiErr) {
      replyText = "API 查詢服務暫時異常，請稍後再試。";
    }

    // 4. 回傳訊息給 LINE
    await client.replyMessage(event.replyToken, { type: "text", text: replyText });
    return res.status(200).send("Reply Sent");

  } catch (err) {
    console.error("重大錯誤:", err);
    return res.status(200).send("Error Handled"); // 這裡回 200 是為了避免 LINE 因 500 而重發請求
  }
};
