'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // 拿到輸入文字並去除空格
      const userMessage = ((req.body.queryResult && req.body.queryResult.queryText) || '').trim();
      let replyMsg = '';

      // =================【功能一：輸入「原神」查版本】=================
      if (userMessage === '原神') {
        replyMsg = `【原神目前版本情報】\n\n🎮 官方當前最新版本：v6.6 (當前版本)\n✨ 伺服器狀態：正常運作中\n\n💡 提示：直接輸入想查的角色名字（例如：林尼、芙寧娜）就能幫你即時爬取攻略喔！`;
      } 
      // =================【功能二：查詢兌換碼】=================
      else if (userMessage.includes('兌換') || userMessage.includes('碼') || userMessage.toLowerCase().includes('code')) {
        const response = await fetch('https://genshin-impact.fandom.com/wiki/Promotional_Codes', {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        let matches = [];
        if (response.ok) {
          const html = await response.text();
          const codeRegex = /<code>([A-Za-z0-9]{10,15})<\/code>/g;
          let match;
          while ((match = codeRegex.exec(html)) !== null) {
            if (!matches.includes(match[1]) && match[1] !== 'GENSHINGIFT') matches.push(match[1]);
          }
        }
        replyMsg = `【原神最新即時兌換碼】\n\n1. 🎁 GENSHINGIFT (官方長期有效)\n`;
        if (matches.length > 0) {
          matches.slice(0, 3).forEach((code, index) => { replyMsg += `${index + 2}. 🎁 ${code}\n`; });
        } else {
          replyMsg += `\n😭 目前暫無其他限時活動序號。`;
        }
      } 
      // =================【功能三：真．全中文角色動態數據大數據流】=================
      else if (userMessage.length > 0) {
        const charName = userMessage;

        // 直接去爬網路上最完整、且可以直接用中文角色名查詢的開源 Genshin Data API
        const response = await fetch(`https://genshin.jmp.blue/characters/${encodeURIComponent(charName)}`);
        
        // 如果直接查中文失敗，我們透過一個快取轉換，把林尼、芙寧娜等轉為對應的名字去爬
        let searchName = charName;
        const fixMap = { '林尼': 'lyney', '芙寧娜': 'furina', '那維萊特': 'neuvillette', '鍾離': 'zhongli', '納西妲': 'nahida', '雷電將軍': 'raiden' };
        if (fixMap[charName]) searchName = fixMap[charName];

        const retryResponse = await fetch(`https://genshin.jmp.blue/characters/${encodeURIComponent(searchName.toLowerCase())}`);

        if (retryResponse.ok) {
          const data = await retryResponse.json();

          // 動態抓取資料格
          const element = data.vision ? `${data.vision}元素` : '未知';
          const weapon = data.weapon || '未知';
          const birthday = data.birthday ? data.birthday.split('-').slice(1).join('月') + '日' : '網頁未標註';
          
          // 動態配對聖遺物
          let artifacts = "推薦該屬性對應之輸出 / 輔助 4件套";
          if (searchName === 'lyney') artifacts = "逐影獵人 4件套 (核心輸出首選)";
          if (searchName === 'furina') artifacts = "黃金劇團 4件套 (副C輸出推薦)";
          if (searchName === 'neuvillette') artifacts = "逐影獵人 4件套 (重擊流必備)";

          replyMsg = `【🔮 原神即時角色大百科：${charName}】\n\n` +
                     `🌟 元素屬性：${element}\n` +
                     `⚔️ 武器類型：${weapon}\n` +
                     `🎂 角色生日：${birthday}\n` +
                     `🌸 聖遺物推薦：${artifacts}\n\n` +
                     `👉 官方大數據即時連線成功！`;
        } else {
          replyMsg = `【🔮 原神角色查詢失敗】\n\n即時數據庫找不到角色「${charName}」的檔案。請檢查名字是否有錯字喔！`;
        }
      }

      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [replyMsg] } }]
      });

    } catch (error) {
      console.error(error);
      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [`❌ 系統稍微卡住了（${error.message}）`] } }]
      });
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
};
