const axios = require("axios");
const cheerio = require("cheerio");
const characters = require("../data/characters.json");

const list = Object.entries(characters);

//
// ==========================
// 🟡 Gemini AI fallback
// ==========================
//
async function askGemini(name) {
  try {

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text:
`你是原神角色資料助手，請用以下格式回答：

角色名稱：${name}
稀有度：
武器類型：
簡短介紹：

如果不是已知角色，請合理推測或回答「未知角色」。`
              }
            ]
          }
        ]
      }
    );

    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

  } catch (e) {
    return null;
  }
}

//
// ==========================
// 🟡 Wiki 爬蟲 fallback
// ==========================
//
async function crawlWiki(name) {
  try {

    const url =
      `https://wiki.biligame.com/ys/${encodeURIComponent(name)}`;

    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    const title = $("h1").first().text();
    const desc = $(".mw-parser-output p")
      .first()
      .text()
      .trim();

    if (!title) return null;

    return {
      name: title,
      description: desc || "無資料"
    };

  } catch (e) {
    return null;
  }
}

//
// ==========================
// 🧠 主 webhook
// ==========================
//
module.exports = async (req, res) => {
  try {

    const query =
      req.body.queryResult?.queryText?.trim();

    if (!query) {
      return res.json({
        fulfillmentText: "請輸入角色名稱或條件"
      });
    }

    const q = query.toLowerCase();

    // =========================
    // 1️⃣ 本地 JSON 查詢（最高優先）
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
    // 2️⃣ 官方 API 查詢
    // =========================
    try {

      const apiList = await axios.get(
        "https://genshin.jmp.blue/characters"
      );

      const found = apiList.data.find(c =>
        c.toLowerCase() === q
      );

      if (found) {

        const d = await axios.get(
          `https://genshin.jmp.blue/characters/${found}`
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

    // =========================
    // 3️⃣ Wiki 爬蟲 fallback
    // =========================
    const wiki = await crawlWiki(query);

    if (wiki) {
      return res.json({
        fulfillmentText:
`（Wiki資料）

角色：${wiki.name}

介紹：
${wiki.description}`
      });
    }

    // =========================
    // 4️⃣ Gemini AI fallback
    // =========================
    const ai = await askGemini(query);

    if (ai) {
      return res.json({
        fulfillmentText:
`（AI補充）

${ai}`
      });
    }

    // =========================
    // ❌ 都找不到
    // =========================
    return res.json({
      fulfillmentText:
`找不到角色或資料：
${query}`
    });

  } catch (e) {
    console.error(e);

    return res.json({
      fulfillmentText: "系統錯誤"
    });
  }
};
