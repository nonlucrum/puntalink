// routes/pilares.js
const express = require('express');
const router = express.Router();
const pilaresService = require('../services/pilares');

router.post('/compute', (req, res) => {
  try {
    const out = pilaresService.calcular(req.body);
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
