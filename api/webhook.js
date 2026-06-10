'use strict';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  try {
    const userMessage = (req.body.queryResult?.queryText || '').trim();
    if (!userMessage) return;

    // 1. 直接搜尋 Wiki 取得該角色的精準英文名稱
    const searchRes = await fetch(`https://genshin-impact.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(userMessage)}&format=json&origin=*`);
    const searchData = await searchRes.json();
    const englishName = searchData.query?.search[0]?.title || userMessage;

    // 2. 爬取網頁資料
    const wikiRes = await fetch(`https://genshin-impact.fandom.com/wiki/${encodeURIComponent(englishName)}`);
    const html = await wikiRes.text();

    // 3. 提取欄位
    const getVal = (regex) => html.match(regex)?.[1]?.replace(/<[^>]*>/g, '').trim() || '未標註';
    const element = getVal(/data-source="element"[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
    const weapon = getVal(/data-source="weapon"[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
    const birthday = getVal(/data-source="birthday"[\s\S]*?<div[^>]*>([^<]+)<\/div>/i);
    
    // 4. 動態擷取聖遺物 (不寫死，只抓網頁出現的推薦文字)
    const artMatch = html.match(/Artifacts<\/h2>[\s\S]*?<ul>([\s\S]*?)<\/ul>/i);
    const artifacts = artMatch ? artMatch[1].replace(/<[^>]*>/g, ' / ').replace(/\n/g, '').trim() : '請查看 Wiki 連結';

    const reply = `【${userMessage} 即時資料】\n元素：${element}\n武器：${weapon}\n生日：${birthday}\n推薦配置：${artifacts}\n\n👉 來源：Fandom Wiki`;

    return res.status(200).json({ fulfillmentMessages: [{ text: { text: [reply] } }] });
  } catch (e) {
    return res.status(200).json({ fulfillmentMessages: [{ text: { text: [`查詢失敗，請換個名稱試試！`] } }] });
  }
};
