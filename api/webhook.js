const line = require("@line/bot-sdk");
const axios = require("axios");

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(config);

module.exports = async (req, res) => {
  try {

    // ✅ 這行是修復重點（不要刪）
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const event = body?.events?.[0];

    if (!event) {
      return res.status(200).send("OK");
    }

    if (event.type !== "message") {
      return res.status(200).send("OK");
    }

    const userMessage = event.message.text.trim();

    const response = await axios.get(
      "https://genshin.jmp.blue/characters"
    );

    const characters = response.data;

    const found = characters.find(
      c => c.toLowerCase() === userMessage.toLowerCase()
    );

    let replyText = "";

    if (!found) {
      replyText = "找不到角色，請輸入英文（例如 furina）";
    } else {

      const detail = await axios.get(
        `https://genshin.jmp.blue/characters/${found}`
      );

      const data = detail.data;

      replyText =
`角色：${data.name}
元素：${data.vision}
武器：${data.weapon}
稀有度：${data.rarity}★`;
    }

    await client.replyMessage(event.replyToken, {
      type: "text",
      text: replyText
    });

    return res.status(200).end();

  } catch (err) {
    console.error(err);
    return res.status(200).send("ERROR BUT HANDLED");
  }
};
