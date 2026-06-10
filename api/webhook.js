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

    // 👉 先用最簡單方式回（LINE 之後再接）
    return res.status(200).json({ reply });

  } catch (e) {
    console.error(e);
    return res.status(200).send("error handled");
  }
};
