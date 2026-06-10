'use strict';

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    const userMessage = (req.body.queryResult?.queryText || '').trim();
    
    try {
        // 1. Google Search: 找 Wiki 網址
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CSE_ID}&q=原神+${encodeURIComponent(userMessage)}+攻略`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        if (!searchData.items || searchData.items.length === 0) {
            return res.status(200).json({ fulfillmentMessages: [{ text: { text: [`找不到關於「${userMessage}」的攻略。`] } }] });
        }
        
        const targetUrl = searchData.items[0].link;

        // 2. 用 Jina Reader 把網頁變成 AI 易讀的 Markdown
        const jinaRes = await fetch(`https://r.jina.ai/${targetUrl}`);
        const markdown = await jinaRes.text();

        // 3. 用 Gemini 整理資料
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `請根據以下網頁內容，整理出原神角色「${userMessage}」的詳細攻略：
        1. 角色定位與主要功能
        2. 推薦武器 (3把)
        3. 推薦聖遺物 (含主詞條建議)
        4. 天賦升級優先級
        請用繁體中文，格式整潔，像專業遊戲攻略一樣簡明扼要。
        
        網頁內容: ${markdown.substring(0, 10000)}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return res.status(200).json({ 
            fulfillmentMessages: [{ text: { text: [responseText] } }] 
        });

    } catch (error) {
        console.error(error);
        return res.status(200).json({ 
            fulfillmentMessages: [{ text: { text: [`系統錯誤：${error.message}`] } }] 
        });
    }
};
