const axios = require("axios");

// 自建角色資料
const customCharacters = {
  "尼可": {
    english: "Nicole",
    rarity: "5★",
    weapon: "法器",
    description: "無言的「魔女」，棄聲的「天使」"
  },

  "法爾伽": {
    english: "Varka",
    rarity: "5★",
    weapon: "雙手劍",
    description: "西風騎士團大團長，守護蒙德的北風騎士。"
  },

  "洛恩": {
    english: "Lohen",
    rarity: "5★",
    weapon: "長柄武器",
    description: "西風騎士團遠程小隊副隊長，行事不拘一格，鍾情於非常規戰術的騎士。"
  }
};

const nameMap = {
  "芙寧娜": "furina",
  "胡桃": "hutao",
  "雷電將軍": "raiden",
  "鍾離": "zhongli",
  "那維萊特": "neuvillette"
};

module.exports = async (req, res) => {

  try {

    const query =
      req.body.queryResult?.queryText?.trim();

    // ====================
    // 先查自建角色
    // ====================

    if (customCharacters[query]) {

      const c = customCharacters[query];

      return res.json({
        fulfillmentText:
`角色：${query}
英文：${c.english}
稀有度：${c.rarity}
武器：${c.weapon}

簡介：
${c.description}`
      });

    }

    // ====================
    // 再查官方 API
    // ====================

    const key =
      nameMap[query] ||
      query.toLowerCase();

    const list = await axios.get(
      "https://genshin.jmp.blue/characters"
    );

    const found = list.data.find(
      c => c.toLowerCase() === key
    );

    if (!found) {

      return res.json({
        fulfillmentText:
          `找不到角色：${query}`
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
