const line = require("@line/bot-sdk");
const axios = require("axios");

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(config);

module.exports = async (req, res) => {
  try {

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const event = body?.events?.[0];

    if (!event || event.type !== "message") {
      return res.status(200).send("OK");
    }

    const text = event.message.text.trim();

    const list = await axios.get(
      "https://genshin.jmp.blue/characters"
    );

    const found = list.data.find(
      c => c.toLowerCase() === text.toLowerCase()
    );

    let reply = "";

    if (!found) {
      reply = "找不到角色（請輸入英文，例如 furina）";
    } else {
      const detail = await axios.get(
        `https://genshin.jmp.blue/characters/${found}`
      );

      const d = detail.data;

      reply =
`角色：${d.name}
元素：${d.vision}
武器：${d.weapon}
稀有度：${d.rarity}★`;
    }

    // ✅ 這裡才是真正回 LINE
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: reply
    });

    return res.status(200).end();

  } catch (err) {
    console.error(err);
    return res.status(200).send("error handled");
  }
};
