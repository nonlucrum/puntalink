const calculosService = require('../services/calculos');

const calculosController = {
  procesar: async (req, res) => {
    try {
      const result = await calculosService.runCalculations(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = calculosController;
