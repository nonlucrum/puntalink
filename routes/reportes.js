// routes/reportes.js
const express = require('express');
const router = express.Router();
const { exportPilares } = require('../controllers/reportePilaresController');

// POST /api/reportes/pilares/:format   (format = pdf | docx)
router.post('/pilares/:format', exportPilares);

module.exports = router;
