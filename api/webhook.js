const axios = require("axios");

module.exports = async (req, res) => {
  try {

    // ✅ 安全解析 body
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
      replyText = "找不到角色（請輸入英文，如 furina）";
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

    // ✅ 先用最簡單回覆（避免 LINE SDK crash）
    return res.status(200).json({
      reply: replyText
    });

  } catch (err) {
    console.error(err);
    return res.status(200).send("handled error");
  }
};
