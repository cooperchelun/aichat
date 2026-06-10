'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // 換成另一個更穩定的即時原神序號 API 來源
      const response = await fetch('https://raw.githubusercontent.com/Yuanshin/Genshin-Impact-Codes/main/codes.json');
      
      // 如果這個來源也失敗，嘗試備用來源
      if (!response.ok) {
        throw new Error('主要伺服器連線失敗');
      }
      
      const data = await response.json();
      
      // 支援多種常見的 JSON 欄位結構（相容性最高防錯）
      const codesArray = Array.isArray(data) ? data : (data.codes || data.active || []);
      
      // 篩選出目前有效的序號
      const activeCodes = codesArray.filter(item => {
        const status = (item.status || '').toLowerCase();
        return item.is_active === true || status === 'active' || status === 'working';
      });
      
      let replyMsg = `【原神最新即時兌換碼】\n\n`;
      
      if (activeCodes.length === 0) {
        replyMsg += `😭 目前網路上暫時沒有可用的有效兌換碼喔！\n官方通常會在改版直播時釋出新序號，請過陣子再試試看！`;
      } else {
        activeCodes.forEach((item, index) => {
          const code = item.code || item.promocode || item.string;
          const reward = item.reward || item.rewards || item.description || '點擊複製';
          replyMsg += `${index + 1}. 🎁 ${code} (${reward})\n`;
        });
        replyMsg += `\n👉 自動爬蟲成功！以上是為您即時抓取的最新有效序號。`;
      }

      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [replyMsg] } }]
      });

    } catch (error) {
      console.error(error);
      
      // 如果網路真的完全斷開或抓不到，直接給予目前「絕對可用」的官方永久序號作為保底，絕對不讓使用者看到冷冰冰的錯誤！
      const backupMsg = `【原神最新兌換碼】\n\n` +
                        `1. 🎁 GENSHINGIFT (原石x50 + 大經驗書x3)\n\n` +
                        `⚠️ 提示：網路即時爬蟲暫時開小差（${error.message}），已自動為您奉上官方長期有效序號！`;
                        
      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [backupMsg] } }]
      });
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
};
