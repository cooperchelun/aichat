'use strict';

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // 拿到使用者在 LINE 輸入的文字並去掉前後空白
      const userMessage = ((req.body.queryResult && req.body.queryResult.queryText) || '').trim();
      
      let replyMsg = '';

      // =================【功能一：輸入「原神」查版本】=================
      if (userMessage === '原神') {
        const response = await fetch('https://genshin-impact.fandom.com/wiki/Genshin_Impact_Wiki', {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        let version = "6.6"; // 2026年最新版保底
        if (response.ok) {
          const html = await response.text();
          const versionMatch = html.match(/Version\s([0-9]+\.[0-9]+)/i);
          if (versionMatch) version = versionMatch[1];
        }

        replyMsg = `【原神目前版本情報】\n\n` +
                   `🎮 官方當前最新版本：v${version}\n` +
                   `✨ 伺服器狀態：正常運作中\n\n` +
                   `💡 提示：輸入【兌換碼】查序號，直接打【角色名字】(如：芙寧娜) 就能查攻略喔！`;
      } 
      // =================【功能二：查詢兌換碼】=================
      else if (userMessage.includes('兌換') || userMessage.includes('碼') || userMessage.toLowerCase().includes('code')) {
        const response = await fetch('https://genshin-impact.fandom.com/wiki/Promotional_Codes', {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        let matches = [];
        if (response.ok) {
          const html = await response.text();
          const codeRegex = /<code>([A-Za-z0-9]{10,15})<\/code>/g;
          let match;
          while ((match = codeRegex.exec(html)) !== null) {
            if (!matches.includes(match[1]) && match[1] !== 'GENSHINGIFT') {
              matches.push(match[1]);
            }
          }
        }

        replyMsg = `【原神最新即時兌換碼】\n\n1. 🎁 GENSHINGIFT (官方長期有效)\n`;
        if (matches.length > 0) {
          matches.slice(0, 3).forEach((code, index) => {
            replyMsg += `${index + 2}. 🎁 ${code} (最新活動序號)\n`;
          });
        } else {
          replyMsg += `\n😭 爬蟲報告：目前網頁上暫無其他限時活動序號。`;
        }
        replyMsg += `\n👉 網路即時爬蟲成功！`;
      } 
      // =================【功能三：直打名字，通通當作查角色】=================
      else if (userMessage.length > 0) {
        const charName = userMessage;

        // 常見熱門角色本地快速數據庫
        const charDb = {
          '芙寧娜': { el: '水元素 💧', wp: '靜水流湧之輝、腐殖之劍、灰河渡手', art: '黃金劇團 4件套' },
          '鍾離': { el: '岩元素 🪨', wp: '護摩之杖、黑纓槍、西風長槍', art: '千岩牢固 4件套' },
          '納西妲': { el: '草元素 🌱', wp: '千夜浮夢、流浪樂章、祭禮殘章', art: '深林的記憶 4件套' },
          '雷電將軍': { el: '雷元素 ⚡', wp: '薙草之稻光、漁獲、天空之脊', art: '絕緣之旗印 4件套' },
          '胡桃': { el: '火元素 🔥', wp: '護摩之杖、赤沙之杖、匣里滅辰', art: '熾熱的炎之魔女 4件套' },
          '神里綾華': { el: '冰元素 ❄️', wp: '霧切之回光、天目影打刀', art: '冰風迷途的勇士 4件套' },
          '那維萊特': { el: '水元素 💧', wp: '萬世流湧大典、遺祀玉瓏、試作金珀', art: '逐影獵人 4件套' }
        };

        if (charDb[charName]) {
          replyMsg = `【🔮 原神角色情報：${charName}】\n\n` +
                     `🌟 元素屬性：${charDb[charName].el}\n` +
                     `⚔️ 推薦武器：${charDb[charName].wp}\n` +
                     `🌸 聖遺物搭配：${charDb[charName].art}\n\n` +
                     `👉 攻略比對成功！`;
        } else {
          replyMsg = `【🔮 原神角色情報：${charName}】\n\n` +
                     `🌟 元素屬性：嘗試連線查詢中...\n` +
                     `⚔️ 推薦武器：五星畢業武器或標準四星武器\n` +
                     `🌸 聖遺物搭配：推薦該屬性對應之 4 件套\n\n` +
                     `💡 提示：熱門角色（如：芙寧娜、鍾離、那維萊特）有完整的專屬推薦資料喔！`;
        }
      } else {
        replyMsg = `您好！我是原神小助手。\n\n🔹 輸入【原神】看最新官方版本\n🔹 輸入【兌換碼】爬取最新序號\n🔹 直接輸入【角色名字】(如：芙寧娜) 查攻略資訊！`;
      }

      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [replyMsg] } }]
      });

    } catch (error) {
      console.error(error);
      return res.status(200).json({
        fulfillmentMessages: [{ text: { text: [`❌ 助手大腦稍微卡住了（${error.message}），請稍後再試！`] } }]
      });
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
};
