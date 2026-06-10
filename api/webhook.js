async function chatWithGemini(text) {
  try {
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      process.env.GEMINI_API_KEY;

    const res = await axios.post(url, {
      contents: [
        {
          parts: [
            {
              text: `
你是一個原神助手 + 日常聊天助手。

規則：
- 只回答原神相關或日常問題
- 不要亂編不存在的角色
- 不確定就說不知道
- 回答要簡短

使用者：${text}
`
            }
          ]
        }
      ]
    });

    return (
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text || null
    );

  } catch (e) {
    console.log("Gemini error:", e.response?.data || e.message);
    return null;
  }
}
