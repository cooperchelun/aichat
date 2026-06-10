const axios = require("axios");
const characters = require("../data/characters.json");

const list = Object.entries(characters);

module.exports = async (req, res) => {
  try {

    // =========================
    // 🟢 防 Vercel / Dialogflow body 問題
    // =========================
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const query =
      body?.queryResult?.queryText?.trim();

    if (!query) {
      return res.json({
        fulfillmentText: "請輸入角色名稱或條件"
      });
    }

    const q = query.toLowerCase();

    // =========================
    // 1️⃣ 本地 JSON（最高優先）
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
    // 2️⃣ 官方 API（備用）
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
      // API 壞掉不影響主流程
    }

    // =========================
    // 3️⃣ 找不到
    // =========================
    return res.json({
      fulfillmentText:
`找不到角色或資料：
${query}

請確認名稱，例如：
- 尼可
- Furina
- 鍾離`
    });

  } catch (e) {
    console.error(e);

    return res.json({
      fulfillmentText: "系統錯誤，請稍後再試"
    });
  }
};
