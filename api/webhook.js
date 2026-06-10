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

async function askAI(name) {
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `請提供角色：${name} 的原神資料`
          }]
        }]
      }
    );

    console.log("🔥 AI RAW:", JSON.stringify(res.data, null, 2));

    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

  } catch (e) {
    console.log("❌ AI ERROR:", e.response?.data || e.message);
    return null;
  }
}

module.exports = async (req, res) => {
  try {

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const query = body?.queryResult?.queryText?.trim();

    console.log("🟡 QUERY:", query);

    if (!query) {
      return res.json({ fulfillmentText: "no query" });
    }

    const q = query.toLowerCase();

    // 1️⃣ JSON
    const local = list.find(([name, c]) =>
      name.toLowerCase() === q ||
      c.english?.toLowerCase() === q
    );

    if (local) {
      console.log("✅ HIT JSON");
      return res.json({
        fulfillmentText: `JSON命中：${local[0]}`
      });
    }

    // 2️⃣ API
    try {
      const api = await axios.get("https://genshin.jmp.blue/characters");

      const found = api.data.find(c => c.toLowerCase() === q);

      if (found) {
        console.log("✅ HIT API");

        return res.json({
          fulfillmentText: `API命中：${found}`
        });
      }

    } catch (e) {
      console.log("❌ API ERROR");
    }

    // 3️⃣ AI
    console.log("🟣 ENTER AI");

    const ai = await askAI(query);

    console.log("🟣 AI RESULT:", ai);

    if (ai) {
      return res.json({
        fulfillmentText: ai
      });
    }

    return res.json({
      fulfillmentText: "全部都沒命中"
    });

  } catch (e) {
    console.error(e);

    return res.json({
      fulfillmentText: "系統錯誤"
    });
  }
};
