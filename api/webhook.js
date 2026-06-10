'use strict';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const userMessage = (req.body.queryResult?.queryText || '').trim();
    
    // 直接透過角色名稱查詢 API (這是最穩定的方式)
    const response = await fetch(`https://genshin.jmp.blue/characters/${encodeURIComponent(userMessage.toLowerCase().replace(/\s+/g, '-'))}`);
    
    if (!response.ok) {
        return res.status(200).json({ fulfillmentMessages: [{ text: { text: [`找不到角色「${userMessage}」，請檢查名字是否正確 (例如：胡桃、林尼)。`] } }] });
    }

    const data = await response.json();
    
    // 整理回應內容
    const reply = `【${data.name}】
🌟 元素：${data.vision}
⚔️ 武器：${data.weapon}
🎂 生日：${data.birthday}
🌸 簡介：${data.description.substring(0, 50)}...`;

    return res.status(200).json({ fulfillmentMessages: [{ text: { text: [reply] } }] });
  } catch (error) {
    return res.status(200).json({ fulfillmentMessages: [{ text: { text: [`系統錯誤，請稍後再試。`] } }] });
  }
};
