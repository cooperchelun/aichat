// 3️⃣ 元素搜尋（新增）
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
let elementKey = null;

for (const [key, elem] of Object.entries(elements)) {
  if (elem.aliases.some(alias => alias.toLowerCase() === q)) {
    foundElement = key;
    elementKey = key;
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
