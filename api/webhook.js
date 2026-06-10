module.exports = async (req, res) => {
  console.log("LINE HIT");
  return res.status(200).send("OK FROM VERCEL");
};
