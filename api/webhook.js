const axios = require("axios");

module.exports = async (req, res) => {
  try {

    const query = req.body.queryResult?.queryText;

    const list = await axios.get(
      "https://genshin.jmp.blue/characters"
    );

    const found = list.data.find(
      c => c.toLowerCase() === query.toLowerCase()
    );

    if (!found) {
      return res.json({
        fulfillmentText: "找不到角色（請確認名稱）"
      });
    }

    const detail = await axios.get(
      `https://genshin.jmp.blue/characters/${found}`
    );

    const d = detail.data;

    return res.json({
      fulfillmentText:
`角色：${d.name}
元素：${d.vision}
武器：${d.weapon}
稀有度：${d.rarity}★`
    });

  } catch (e) {
    console.error(e);
    return res.json({
      fulfillmentText: "查詢失敗"
    });
  }
};
