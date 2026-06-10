const axios = require("axios");
const fs = require("fs");
const path = require("path");

// 讀你自己的角色庫
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

    // =========================
    // 1️⃣ 先查你的 JSON（新角色）
    // =========================
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

    // =========================
    // 2️⃣ 再查官方 API（舊角色補齊）
    // =========================
    try {

      const apiList = await axios.get(
        "https://genshin.jmp.blue/characters",
        { timeout: 3000 }
      );

      const found = apiList.data.find(c =>
        c.toLowerCase() === q
      );

      if (found) {

        const d = await axios.get(
          `https://genshin.jmp.blue/characters/${found}`,
          { timeout: 3000 }
        );

        return res.json({
          fulfillmentText:
`角色：${d.data.name}
元素：${d.data.vision}
武器：${d.data.weapon}
稀有度：${d.data.rarity}★`
        });
      }

    } catch (e) {
      // API 掛掉不影響
    }

    // =========================
    // 3️⃣ 找不到
    // =========================
    return res.json({
      fulfillmentText:
`找不到角色：
${query}

（目前資料庫與API都沒有）`
    });

  } catch (e) {
    console.error(e);

    return res.json({
      fulfillmentText: "系統錯誤"
    });
  }
};
