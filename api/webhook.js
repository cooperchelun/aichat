const axios = require("axios");
const characters = require("../data/characters.json");

const list = Object.entries(characters);

module.exports = async (req, res) => {
  try {

    // =========================
    // 🟢 防 Dialogflow / Vercel 格式問題
    // =========================
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
    // 🟢 本地 JSON（一定最優先）
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
    // 🟡 簡化 API fallback（保留但不阻塞）
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
      // API fail 不影響主流程
    }

    // =========================
    // ❌ 找不到（先不要 AI / 爬蟲）
    // 👉 避免 timeout
    // =========================
    return res.json({
      fulfillmentText:
`找不到角色：
${query}

請確認名稱（例如：尼可 / Furina）`
    });

  } catch (e) {
    console.error(e);

    return res.json({
      fulfillmentText: "系統錯誤"
    });
  }
};
