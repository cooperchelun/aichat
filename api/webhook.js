const axios = require("axios");

module.exports = async (req, res) => {
  try {

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const event = body?.events?.[0];

    if (!event) return res.status(200).send("OK");

    const text = event.message.text;

    const list = await axios.get(
      "https://genshin.jmp.blue/characters"
    );

    const found = list.data.find(
      c => c.toLowerCase() === text.toLowerCase()
    );

    if (!found) {
      return res.status(200).json({
        reply: "找不到角色（輸入 furina）"
      });
    }

    const detail = await axios.get(
      `https://genshin.jmp.blue/characters/${found}`
    );

    return res.status(200).json({
      reply:
`角色：${detail.data.name}
元素：${detail.data.vision}
武器：${detail.data.weapon}
稀有度：${detail.data.rarity}★`
    });

  } catch (err) {
    console.error(err);
    return res.status(200).send("handled error");
  }
};
