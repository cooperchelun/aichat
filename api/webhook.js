module.exports = async (req, res) => {
  console.log("ENV CHECK:", {
    token: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    secret: process.env.LINE_CHANNEL_SECRET
  });

  console.log("BODY:", req.body);

  return res.status(200).send("debug ok");
};
