const axios = require("axios");

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
    const key = nameMap[query] || query.toLowerCase();

    const list = await axios.get(
      "https://genshin.jmp.blue/characters"
    );

    const found = list.data.find(
      c => c.toLowerCase() === key.toLowerCase()
    );

    if (!found) {
      return res.json({
        fulfillmentText: "找不到角色"
      });
    }

    const d = (await axios.get(
      `https://genshin.jmp.blue/characters/${found}`
    )).data;

    // 🔥 技能整理
    const skills = (d.skillTalents || [])
      .map(s => s.name)
      .join("、") || "無資料";

    const passives = (d.passiveTalents || [])
      .map(p => p.name)
      .join("、") || "無資料";

    const cons = (d.constellations || [])
      .map(c => c.name)
      .join("、") || "無資料";

    return res.json({
      fulfillmentText:
`🌟 ${d.name}

🌊 元素：${d.vision}
⚔ 武器：${d.weapon}
⭐ 稀有度：${d.rarity}★

🔥 技能：
${skills}

🧠 被動：
${passives}

🌌 命座：
${cons}`
    });

  } catch (e) {
    console.error(e);
    return res.json({
      fulfillmentText: "查詢失敗"
    });
  }
};
