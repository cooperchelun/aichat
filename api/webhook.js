'use strict';

const { WebhookClient } = require('dialogflow-fulfillment');

module.exports = async (req, res) => {
  // 確保只處理 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const agent = new WebhookClient({ request: req, response: res });

  // 原神專屬處理函式
  function genshinHandler(agent) {
    const replyMsg = `【原神最新兌換碼情報】\n\n` +
                     `1. 🎁 CA3BLB86MCRJ (原石x60)\n` +
                     `2. 🎁 GDAJBZ55M83R (摩拉x10000)\n\n` +
                     `👉 這是從 Vercel 成功送出的回應喔！`;
    agent.add(replyMsg);
  }

  // 對應 Dialogflow 的 Intent 名稱
  let intentMap = new Map();
  intentMap.set('查詢原神', genshinHandler);
  
  agent.handleRequest(intentMap);
};
