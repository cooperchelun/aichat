const axios = require('axios');

module.exports = async (req, res) => {

    const text =
        req.body.events?.[0]?.message?.text;

    if (!text)
        return res.status(200).end();

    const response = await axios.get(
        `https://genshin.jmp.blue/characters/${encodeURIComponent(text)}`
    );

    const data = response.data;

    const replyText =
`角色：${data.name}
元素：${data.vision}
武器：${data.weapon}`;

    res.status(200).json({
        reply: replyText
    });
};
