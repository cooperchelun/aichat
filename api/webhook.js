module.exports = async (req, res) => {
  try {

    const body = req.body;

    const query = body.queryResult?.queryText;

    return res.json({
      fulfillmentText: "你輸入的是：" + query
    });

  } catch (e) {
    return res.json({
      fulfillmentText: "error"
    });
  }
};
