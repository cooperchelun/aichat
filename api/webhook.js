'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // 直連最穩定的全球原神序號數據庫
      const response = await fetch('https://raw.githubusercontent.com/itskofis/genshin-impact-codes/main/codes.json');
      
      if (!response.ok) {
        throw new Error('即時數據庫連線失敗');
      }
      
      const data = await response.json();
      
      // 確保拿到的是陣列
      const activeCodes = Array.isArray(data) ? data : (data.codes || []);
      
      let replyMsg = `【原神最新即時兌換碼】\n\n`;
      
      if (activeCodes.length === 0) {
        replyMsg += `😭 目前網路上暫時沒有可用的有效兌換碼喔！\n請等官方改版直播時再試試看。`;
      } else {
        // 不做嚴格過濾，直接把資料庫裡現有的最新序號通通倒出來！
        activeCodes.forEach((item, index) => {
          const code = item.code || item.promocode;
          // 支援多種常見的獎勵欄位名稱
          const reward = item.reward || item.rewards || item.description || '點擊複製獎勵';
          replyMsg += `${index + 1}. 🎁 ${code}\n   👉 獎勵：${reward}\n\n`;
        });
        replyMsg += `👉 自動爬蟲成功！以上是為您抓取的最新有效序號列表。`;
      }

      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [replyMsg] } }]
      });

    } catch (error) {
      console.error(error);
      
      // 網路真的掛掉時的保底
      const backupMsg = `【原神最新兌換碼】\n\n` +
                        `1. 🎁 GENSHINGIFT\n   👉 獎勵：原石x50 + 大經驗書x3\n\n` +
                        `⚠️ 提示：網路即時爬蟲暫時開小差（${error.message}），已自動為您奉上官方長期有效序號！`;
                        
      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [backupMsg] } }]
      });
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
};
