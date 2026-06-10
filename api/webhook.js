const axios = require("axios");

// 中文 → 英文對照表
const nameMap = {
  "芙寧娜": "furina",
  "胡桃": "hutao",
  "雷電將軍": "raiden",
  "鍾離": "zhongli",
  "那維萊特": "neuvillette"
};

module.exports = async (req, res) => {
  try {

    const query = req.body.queryResult?.queryText?.trim();

    // 1️⃣ 先轉英文
    const key = nameMap[query] || query.toLowerCase();

    const list = await axios.get(
      "https://genshin.jmp.blue/characters"
    );

    const found = list.data.find(
      c => c.toLowerCase() === key.toLowerCase()
    );

    if (!found) {
      return res.json({
        fulfillmentText: "找不到角色（請確認名稱）"
      });
    }

    const detail = await axios.get(
      `https://genshin.jmp.blue/characters/${found}`
    );

    const d = detail.data;

    return res.json({
      fulfillmentText:
`角色：${d.name}
元素：${d.vision}
武器：${d.weapon}
稀有度：${d.rarity}★`
    });

  } catch (e) {
    console.error(e);
    return res.json({
      fulfillmentText: "查詢失敗"
    });
  }
};
