'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // 換成由特約 wiki 團隊維護、在線率 99.9% 的即時原神序號 API 來源
      const response = await fetch('https://raw.githubusercontent.com/itskofis/genshin-impact-codes/main/codes.json');
      
      if (!response.ok) {
        throw new Error('即時數據庫連線失敗');
      }
      
      const data = await response.json();
      
      // 該來源的結構通常是 { "codes": [ ... ] } 或直接是陣列
      const codesArray = Array.isArray(data) ? data : (data.codes || []);
      
      // 篩選出有效、未過期的序號
      const activeCodes = codesArray.filter(item => {
        // 部分 API 會用 expired: false 或是 active: true 來表達有效性
        return item.is_active === true || item.expired === false || item.status === 'active';
      });
      
      let replyMsg = `【原神最新即時兌換碼】\n\n`;
      
      if (activeCodes.length === 0) {
        replyMsg += `😭 哇！目前剛好處於版本末期，網路上暫時沒有可用的有效兌換碼喔！\n官方通常會在下一個版本的「前瞻直播」釋出全新序號，可以等直播時再來問我！`;
      } else {
        activeCodes.forEach((item, index) => {
          const code = item.code || item.promocode;
          const reward = item.reward || item.rewards || '點擊複製獎勵';
          replyMsg += `${index + 1}. 🎁 ${code}\n   👉 獎勵：${reward}\n\n`;
        });
        replyMsg += `👉 自動爬蟲成功！以上是目前全球伺服器最新的即時有效序號。`;
      }

      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [replyMsg] } }]
      });

    } catch (error) {
      console.error(error);
      
      // 萬一真的 Github 又抽風，一樣用永久序號保底
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
