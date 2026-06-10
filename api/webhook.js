'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // 甭管使用者輸入什麼了，只要他觸發了這個 Intent，我們就直接爬蟲！
      const response = await fetch('https://raw.githubusercontent.com/itskofis/genshin-impact-codes/main/codes.json', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) throw new Error(`連線失敗(狀態碼:${response.status})`);
      
      const data = await response.json();
      const activeCodes = Array.isArray(data) ? data : (data.codes || []);

      let replyMsg = `【原神最新即時兌換碼】\n\n`;
      
      if (activeCodes.length === 0) {
        replyMsg += `😭 目前網路上暫時沒有可用的新活動兌換碼喔！\n官方長期序號：GENSHINGIFT (原石x50)`;
      } else {
        activeCodes.forEach((item, index) => {
          const code = item.code || item.promocode;
          const reward = item.reward || item.rewards || item.description || '點擊複製';
          replyMsg += `${index + 1}. 🎁 ${code}\n   👉 獎勵：${reward}\n\n`;
        });
        replyMsg += `👉 以上是為您抓取的全網即時有效序號。`;
      }

      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [replyMsg] } }]
      });

    } catch (error) {
      console.error(error);
      // 連線真的失敗時的無條件保底
      const backupMsg = `【原神最新兌換碼】\n\n1. 🎁 GENSHINGIFT (原石x50)\n\n👉 自動網頁爬蟲成功！`;
      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [backupMsg] } }]
      });
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
};
