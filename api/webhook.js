'use strict';
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    const userMessage = (req.body.queryResult?.queryText || '').trim();
    if (!userMessage) return;

    // 搜尋 Wiki
    const searchRes = await fetch(`https://genshin-impact.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(userMessage)}&format=json&origin=*`);
    const searchData = await searchRes.json();
    const englishName = searchData.query?.search[0]?.title || userMessage;

    // 爬取頁面
    const wikiRes = await fetch(`https://genshin-impact.fandom.com/wiki/${encodeURIComponent(englishName)}`);
    const html = await wikiRes.text();

    // 更寬鬆的提取邏輯
    const getVal = (label) => {
        const regex = new RegExp(`data-source="${label}"[\\s\\S]*?>(?:<a[^>]*>)?([^<]+)`, 'i');
        const match = html.match(regex);
        return match ? match[1].trim() : '未找到資料';
    };

    const element = getVal('element');
    const weapon = getVal('weapon');
    const birthday = getVal('birthday');

    const reply = `【${userMessage} 即時資料】\n元素：${element}\n武器：${weapon}\n生日：${birthday}\n\n👉 來源：Fandom Wiki`;
    return res.status(200).json({ fulfillmentMessages: [{ text: { text: [reply] } }] });
  } catch (e) {
    return res.status(200).json({ fulfillmentMessages: [{ text: { text: [`爬取錯誤，請確認名稱是否正確。`] } }] });
  }
};
