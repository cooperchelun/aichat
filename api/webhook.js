const axios = require("axios");
const path = require("path");
const fs = require("fs");

// ⚠️ 注意：這裡是 character.json（沒有 s）
const characters = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "data", "character.json"),
    "utf8"
  )
);

const list = Object.entries(characters);

module.exports = async (req, res) => {
  try {

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const query =
      body?.queryResult?.queryText?.trim();

    if (!query) {
      return res.json({
        fulfillmentText: "請輸入角色名稱"
      });
    }

    const q = query.toLowerCase();

    const local = list.find(([name, c]) =>
      name.toLowerCase() === q ||
      c.english?.toLowerCase() === q
    );

    if (local) {
      const [name, c] = local;

      return res.json({
        fulfillmentText:
`角色：${name}
英文：${c.english}
稀有度：${c.rarity}★
武器：${c.weapon}

介紹：
${c.description}`
      });
    }

    return res.json({
      fulfillmentText: `找不到角色：${query}`
    });

  } catch (e) {
    console.error(e);

    return res.json({
      fulfillmentText: "系統錯誤"
    });
  }
};
