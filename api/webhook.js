// 1️⃣ API 找
let found = list.data.find(c =>
  c.toLowerCase().includes(key.toLowerCase())
);

// 2️⃣ API 沒有 → fallback
if (!found && extraCharacters[query]) {
  const d = extraCharacters[query];

  return res.json({
    fulfillmentText:
`角色：${d.name}
元素：${d.vision}
武器：${d.weapon}
稀有度：${d.rarity}`
  });
}
