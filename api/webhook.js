const axios = require("axios");
const fs = require("fs");
const path = require("path");

// 讀取角色資料
const characters = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "data", "character.json"),
    "utf8"
  )
);

// 讀取國家資料
const nations = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "data", "nation.json"),
    "utf8"
  )
);

const list = Object.entries(characters);

// =========================
// 🟡 Gemini 補資料（取代爬蟲）
// =========================
async function askAI(name) {
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `請提供原神角色資料，格式如下：

角色名稱：${name}
稀有度（如果未知請推測）：
武器類型（如果未知請推測）：
簡短介紹（合理補全）：
`
          }]
        }]
      }
    );

    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text;

  } catch (e) {
    return null;
  }
}

// =========================
// webhook
// =========================
module.exports = async (req, res) => {
  try {

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const query =
      body?.queryResult?.queryText?.trim();

    if (!query) {
      return res.json({
        fulfillmentText: "請輸入角色名稱、國家名稱或元素名稱"
      });
    }

    const q = query.toLowerCase();

    // 0️⃣ 引導提示：當使用者打出「幫我查」等關鍵字
    const helpKeywords = ["幫我查", "幫我查詢", "查詢", "查一下", "查", "搜尋", "找", "幫我找"];
    
    if (helpKeywords.some(keyword => q === keyword || q.startsWith(keyword))) {
      // 如果只有關鍵字沒有具體內容
      if (q.length <= 5 || helpKeywords.some(k => q === k)) {
        return res.json({
          fulfillmentText: `🔍 請輸入你想查詢的內容～

📌 例如：
• 角色名稱：胡桃、甘雨、護士長、父親
• 國家名稱：蒙德、璃月、稻妻、楓丹
• 元素名稱：火、水、冰、雷、風、岩、草

💡 小提示：也可以輸入角色的小名或綽號喔！`
        });
      }
      
      // 如果「幫我查胡桃」這種格式，把關鍵字移除，只保留查詢內容
      let actualQuery = q;
      for (const keyword of helpKeywords) {
        if (actualQuery.startsWith(keyword)) {
          actualQuery = actualQuery.replace(keyword, "").trim();
          break;
        }
      }
      
      // 用移除關鍵字後的內容繼續搜尋
      if (actualQuery) {
        const searchQ = actualQuery;
        
        // 角色搜尋
        let local = null;
        for (const [name, c] of list) {
          const searchKeys = [
            name.toLowerCase(),
            c.english?.toLowerCase(),
            ...(c.aliases || []).map(a => a.toLowerCase())
          ];
          if (searchKeys.includes(searchQ)) {
            local = [name, c];
            break;
          }
        }
        
        if (local) {
          const [name, c] = local;
          return res.json({
            fulfillmentText:
`角色：${name}
英文：${c.english}
稀有度：${c.rarity}★
武器：${c.weapon}
元素：${c.element || "未知"}

介紹：
${c.description}`
          });
        }
        
        // 國家搜尋
        let foundNation = null;
        for (const [nationName, nationData] of Object.entries(nations)) {
          const nationKeys = [
            nationName.toLowerCase(),
            nationData.english?.toLowerCase(),
            ...(nationData.aliases || []).map(a => a.toLowerCase())
          ];
          if (nationKeys.includes(searchQ)) {
            foundNation = { name: nationName, data: nationData };
            break;
          }
        }
        
        if (foundNation) {
          const { name, data } = foundNation;
          const characterList = data.characters.join("、");
          return res.json({
            fulfillmentText:
`🏰 【${name}】

${data.description}

📋 所屬角色（${data.characters.length}位）：
${characterList}

💡 輸入角色名稱可查詢詳細資料`
          });
        }
        
        // 元素搜尋
        const elements = {
          "火": { aliases: ["火", "火元素", "火屬", "火系", "pyro"] },
          "水": { aliases: ["水", "水元素", "水屬", "水系", "hydro"] },
          "冰": { aliases: ["冰", "冰元素", "冰屬", "冰系", "cryo"] },
          "雷": { aliases: ["雷", "雷元素", "雷屬", "雷系", "electro"] },
          "風": { aliases: ["風", "風元素", "風屬", "風系", "anemo"] },
          "岩": { aliases: ["岩", "岩元素", "岩屬", "岩系", "geo"] },
          "草": { aliases: ["草", "草元素", "草屬", "草系", "dendro"] }
        };
        
        let foundElement = null;
        for (const [key, elem] of Object.entries(elements)) {
          if (elem.aliases.some(alias => alias.toLowerCase() === searchQ)) {
            foundElement = key;
            break;
          }
        }
        
        if (foundElement) {
          const elementChars = [];
          for (const [name, c] of list) {
            if (c.element === foundElement) {
              elementChars.push(name);
            }
          }
          
          if (elementChars.length > 0) {
            return res.json({
              fulfillmentText:
`✨ 【${foundElement}元素】角色列表（${elementChars.length}位）：

${elementChars.join("、")}

💡 輸入角色名稱可查詢詳細資料`
            });
          }
        }
      }
    }

    // 1️⃣ 角色搜尋（支援 aliases 別名）
    let local = null;
    
    for (const [name, c] of list) {
      const searchKeys = [
        name.toLowerCase(),
        c.english?.toLowerCase(),
        ...(c.aliases || []).map(a => a.toLowerCase())
      ];
      
      if (searchKeys.includes(q)) {
        local = [name, c];
        break;
      }
    }

    if (local) {
      const [name, c] = local;

      return res.json({
        fulfillmentText:
`角色：${name}
英文：${c.english}
稀有度：${c.rarity}★
武器：${c.weapon}
元素：${c.element || "未知"}

介紹：
${c.description}`
      });
    }

    // 2️⃣ 國家搜尋
    let foundNation = null;
    for (const [nationName, nationData] of Object.entries(nations)) {
      const nationKeys = [
        nationName.toLowerCase(),
        nationData.english?.toLowerCase(),
        ...(nationData.aliases || []).map(a => a.toLowerCase())
      ];
      if (nationKeys.includes(q)) {
        foundNation = { name: nationName, data: nationData };
        break;
      }
    }

    if (foundNation) {
      const { name, data } = foundNation;
      const characterList = data.characters.join("、");
      
      return res.json({
        fulfillmentText:
`🏰 【${name}】

${data.description}

📋 所屬角色（${data.characters.length}位）：
${characterList}

💡 輸入角色名稱可查詢詳細資料`
      });
    }

    // 3️⃣ 元素搜尋
    const elements = {
      "火": { aliases: ["火", "火元素", "火屬", "火系", "pyro"] },
      "水": { aliases: ["水", "水元素", "水屬", "水系", "hydro"] },
      "冰": { aliases: ["冰", "冰元素", "冰屬", "冰系", "cryo"] },
      "雷": { aliases: ["雷", "雷元素", "雷屬", "雷系", "electro"] },
      "風": { aliases: ["風", "風元素", "風屬", "風系", "anemo"] },
      "岩": { aliases: ["岩", "岩元素", "岩屬", "岩系", "geo"] },
      "草": { aliases: ["草", "草元素", "草屬", "草系", "dendro"] }
    };

    let foundElement = null;
    for (const [key, elem] of Object.entries(elements)) {
      if (elem.aliases.some(alias => alias.toLowerCase() === q)) {
        foundElement = key;
        break;
      }
    }

    if (foundElement) {
      const elementChars = [];
      for (const [name, c] of list) {
        if (c.element === foundElement) {
          elementChars.push(name);
        }
      }
      
      if (elementChars.length > 0) {
        return res.json({
          fulfillmentText:
`✨ 【${foundElement}元素】角色列表（${elementChars.length}位）：

${elementChars.join("、")}

💡 輸入角色名稱可查詢詳細資料`
        });
      } else {
        return res.json({
          fulfillmentText: `目前還沒有${foundElement}元素角色的資料，請稍後再試～`
        });
      }
    }

    // 4️⃣ 外部 API（genshin.jmp.blue）
    try {
      const api = await axios.get(
        "https://genshin.jmp.blue/characters",
        { timeout: 3000 }
      );

      const found = api.data.find(c =>
        c.toLowerCase() === q
      );

      if (found) {
        const d = await axios.get(
          `https://genshin.jmp.blue/characters/${found}`,
          { timeout: 3000 }
        );

        return res.json({
          fulfillmentText:
`角色：${d.data.name}
元素：${d.data.vision}
武器：${d.data.weapon}
稀有度：${d.data.rarity}★`
        });
      }
    } catch (e) {}

    // 5️⃣ AI fallback
    const ai = await askAI(query);

    if (ai) {
      return res.json({
        fulfillmentText:
`（AI補全資料）

${ai}`
      });
    }

    return res.json({
      fulfillmentText: `找不到角色、國家或元素：${query}\n\n💡 試試看：胡桃、蒙德、護士長、父親、火元素`
    });

  } catch (e) {
    console.error(e);
    return res.json({
      fulfillmentText: "系統錯誤"
    });
  }
};
