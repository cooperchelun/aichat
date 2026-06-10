const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 初始化 Gemini (記得在環境變數設定 API_KEY)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async (req, res) => {
  try {
    const userInput = req.body.queryResult?.queryText?.trim();
    
    // 1️⃣ 使用 Gemini 解析使用者的意圖 (例如：使用者說"那個拿水槍的很強的傢伙")
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `使用者想查詢原神角色，請根據 "${userInput}" 回傳最可能的角色標準名稱（英文，如果找不到回傳 unknown）。`;
    const result = await model.generateContent(prompt);
    const identifiedName = result.response.text().trim().toLowerCase();

    // 2️⃣ 進行爬蟲獲取資料
    const list = await axios.get("https://genshin.jmp.blue/characters");
    const found = list.data.find(c => c.toLowerCase() === identifiedName);

    if (!found) {
      return res.json({ fulfillmentText: "我查不到這個角色，你能再說清楚一點嗎？" });
    }

    const detail = await axios.get(`https://genshin.jmp.blue/characters/${found}`);
    const d = detail.data;

    // 3️⃣ 讓 Gemini 將資料包裝成更有趣的回答
    const finalPrompt = `請用原神角色 ${d.name} 的口吻或以遊戲導航員的身分，根據這些資料：${JSON.stringify(d)}，寫一段有趣的簡介回答使用者。`;
    const response = await model.generateContent(finalPrompt);

    return res.json({
      fulfillmentText: response.response.text()
    });

  } catch (e) {
    console.error(e);
    return res.json({ fulfillmentText: "系統故障了，請稍後再試。" });
  }
};
