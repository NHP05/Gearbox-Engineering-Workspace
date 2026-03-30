const { calculateGear } = require("../services/calculateService");

exports.calculate = (req, res) => {
  const data = req.body;

  try {
    const result = calculateGear(data);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};