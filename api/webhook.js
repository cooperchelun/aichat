const axios = require("axios");
const fs = require("fs");
const path = require("path");

// =========================
// 📦 讀取角色資料
// =========================
const characters = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "data", "character.json"),
    "utf8"
  )
);

const list = Object.entries(characters);

// =========================
// 🧠 正規化（解決查不到問題關鍵）
// =========================
const normalize = (str) =>
  (str || "")
    .toLowerCase()
    .replace(/\s/g, "");

// =========================
// 💬 基礎聊天（不靠AI）
// =========================
const chatReply = (text) => {
  const t = text.toLowerCase();

  if (t.includes("你好") || t.includes("嗨") || t.includes("hi")) {
    return "你好！我是原神查詢助手 🙂";
  }

  if (t.includes("你是誰")) {
    return "我是原神AI助手，可以查角色、國家，也可以聊天。";
  }

  if (t.includes("謝謝")) {
    return "不客氣 🙂";
  }

  if (t.includes("幫助") || t.includes("help")) {
    return "可以輸入角色名稱（例如：芙寧娜、鍾離）或隨便聊天。";
  }

  return null;
};

// =========================
// 🤖 Gemini（已修正 404）
// =========================
async function chatWithGemini(text) {
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `
你是一個「原神助手 + 日常聊天助手」。

規則：
- 優先回答原神相關問題
- 不要亂編角色資料
- 不確定就說不知道
- 回答要簡短自然

使用者：${text}
`
              }
            ]
          }
        ]
      }
    );

    return (
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text || null
    );
  } catch (e) {
    console.log("Gemini error:", e.response?.data || e.message);
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
    // 1️⃣ JSON 查詢（已修正）
    // =========================
    let local = null;

    for (const [name, c] of list) {
      const keys = [
        normalize(name),
        normalize(c.english)
      ];

      if (keys.includes(q)) {
        local = [name, c];
        break;
      }
    }

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
    // 2️⃣ API 查詢
    // =========================
    try {
      const api = await axios.get(
        "https://genshin.jmp.blue/characters",
        { timeout: 3000 }
      );

      const found = api.data.find(c =>
        normalize(c) === q
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
    // 3️⃣ 基礎聊天
    // =========================
    const chat = chatReply(query);
    if (chat) {
      return res.json({ fulfillmentText: chat });
    }

    // =========================
    // 4️⃣ Gemini 聊天（fallback）
    // =========================
    const aiReply = await chatWithGemini(query);

    if (aiReply) {
      return res.json({ fulfillmentText: aiReply });
    }

    // =========================
    // 5️⃣ 最終 fallback（永不炸）
    // =========================
    return res.json({
      fulfillmentText:
`目前系統未查到相關資訊。

請確認輸入是否正確，
或輸入角色名稱（例如：鍾離、芙寧娜）。`
    });

  } catch (e) {
    console.error(e);

    return res.json({
      fulfillmentText: "系統錯誤"
    });
  }
};
