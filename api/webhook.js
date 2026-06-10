'use strict';
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    const userMessage = (req.body.queryResult?.queryText || '').trim();
    // 這裡直接刪除所有判斷式，收到字就搜
    const searchRes = await fetch(`https://genshin-impact.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(userMessage)}&format=json&origin=*`);
    const searchData = await searchRes.json();
    const englishName = searchData.query?.search[0]?.title || userMessage;

    const wikiRes = await fetch(`https://genshin-impact.fandom.com/wiki/${encodeURIComponent(englishName)}`);
    const html = await wikiRes.text();

    // 抓資料的函數
    const getVal = (label) => {
        const regex = new RegExp(`data-source="${label}"[\\s\\S]*?>(?:<a[^>]*>)?([^<]+)`, 'i');
        const match = html.match(regex);
        return match ? match[1].trim() : '未標註';
    };

    const element = getVal('element');
    const weapon = getVal('weapon');
    const birthday = getVal('birthday');

    const reply = `【搜尋結果：${englishName}】\n元素：${element}\n武器：${weapon}\n生日：${birthday}\n\n👉 來源：Fandom Wiki`;
    return res.status(200).json({ fulfillmentMessages: [{ text: { text: [reply] } }] });
  } catch (e) {
    return res.status(200).json({ fulfillmentMessages: [{ text: { text: [`查詢失敗，請檢查名稱。`] } }] });
  }
};
