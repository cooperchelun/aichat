const axios = require("axios");
const fs = require("fs");
const path = require("path");

const characters = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "data", "character.json"),
    "utf8"
  )
);

const list = Object.entries(characters);

// =========================
// 🟡 Gemini 補資料（取代爬蟲）
// =========================
async function askAI(name) {
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `請提供原神角色資料，格式如下：

角色名稱：${name}
稀有度（如果未知請推測）：
武器類型（如果未知請推測）：
簡短介紹（合理補全）：
`
          }]
        }]
      }
    );

    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text;

  } catch (e) {
    return null;
  }
}

// =========================
// webhook
// =========================
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

    // 1️⃣ JSON
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

    // 2️⃣ API
    try {
      const api = await axios.get(
        "https://genshin.jmp.blue/characters",
        { timeout: 3000 }
      );

      const found = api.data.find(c =>
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
    } catch (e) {}

    // 3️⃣ AI fallback（取代爬蟲）
    const ai = await askAI(query);

    if (ai) {
      return res.json({
        fulfillmentText:
`（AI補全資料）

${ai}`
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
