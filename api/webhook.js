const line = require("@line/bot-sdk");
const axios = require("axios");

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(config);

module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(200).send("Genshin Bot Running");
  }

  try {

    const event = req.body.events?.[0];

    if (!event) {
      return res.status(200).end();
    }

    if (event.type !== "message") {
      return res.status(200).end();
    }

    const userMessage = event.message.text.trim();

    let replyText = "";

    try {

      const response = await axios.get(
        `https://genshin.jmp.blue/characters`
      );

      const characters = response.data;

      const foundCharacter = characters.find(
        char =>
          char.toLowerCase() ===
          userMessage.toLowerCase()
      );

      if (!foundCharacter) {

        replyText =
          "找不到該角色\n\n請輸入英文名稱\n例如：furina";

      } else {

        const detail = await axios.get(
          `https://genshin.jmp.blue/characters/${foundCharacter}`
        );

        const data = detail.data;

        replyText =
`角色：${data.name}

元素：${data.vision}

武器：${data.weapon}

稀有度：${data.rarity}★`;

      }

    } catch (error) {

      replyText =
        "查詢失敗，請稍後再試";

      console.error(error);
    }

    await client.replyMessage(
      event.replyToken,
      {
        type: "text",
        text: replyText
      }
    );

    return res.status(200).end();

  } catch (err) {

    console.error(err);

    return res.status(500).send(err);
  }
};
