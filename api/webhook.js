const axios = require("axios");
const fs = require("fs");
const path = require("path");

// =========================
// 📦 讀取角色資料（最穩核心）
// =========================
const characters = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "data", "character.json"),
    "utf8"
  )
);

const list = Object.entries(characters);

// =========================
// 🧠 正規化（解決查不到問題）
// =========================
const normalize = (str) =>
  (str || "")
    .toLowerCase()
    .replace(/\s/g, "");

// =========================
// 💬 基礎聊天（不用 AI）
// =========================
function ruleChat(text) {
  const t = text.toLowerCase();

  if (t.includes("你好") || t.includes("嗨")) return "你好 🙂 我是原神助手";
  if (t.includes("你是誰")) return "我是原神查詢 + 聊天助手";
  if (t.includes("幫助") || t.includes("help"))
    return "可以查角色（芙寧娜、鍾離）或國家、武器";
  if (t.includes("謝謝")) return "不客氣 🙂";

  return null;
}

// =========================
// 🤖 Gemini（只當聊天備援）
// =========================
async function chatWithGemini(text) {
  try {
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
      process.env.GEMINI_API_KEY;

    const res = await axios.post(url, {
      contents: [
        {
          parts: [{ text }]
        }
      ]
    });

    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

  } catch (e) {
    console.log("❌ Gemini Error:", e.response?.data || e.message);
    return null;
  }
}

// =========================
// 🌐 webhook 主程式
// =========================
module.exports = async (req, res) => {
  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const query = body?.queryResult?.queryText?.trim();

    if (!query) {
      return res.json({ fulfillmentText: "請輸入內容" });
    }

    const q = normalize(query);

    // =========================
    // 1️⃣ JSON 查角色（最高優先）
    // =========================
    for (const [name, c] of list) {
      const keys = [
        normalize(name),
        normalize(c.english)
      ];

      if (keys.includes(q)) {
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
    }

    // =========================
    // 2️⃣ API 補充查詢
    // =========================
    try {
      const api = await axios.get(
        "https://genshin.jmp.blue/characters",
        { timeout: 3000 }
      );

      const found = api.data.find(
        c => normalize(c) === q
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

    // =========================
    // 3️⃣ 規則聊天（便宜快速）
    // =========================
    const rule = ruleChat(query);
    if (rule) {
      return res.json({ fulfillmentText: rule });
    }

    // =========================
    // 4️⃣ Gemini（最後備援）
    // =========================
    const ai = await chatWithGemini(query);

    if (ai) {
      return res.json({ fulfillmentText: ai });
    }

    // =========================
    // 5️⃣ 最終 fallback（永不炸）
    // =========================
    return res.json({
      fulfillmentText:
`目前查無相關資訊。

請確認輸入是否正確（例如：鍾離、芙寧娜）
或嘗試其他關鍵字。`
    });

  } catch (e) {
    console.error(e);

    return res.json({
      fulfillmentText: "系統暫時異常，請稍後再試"
    });
  }
};
