const express = require('express');
const router = express.Router();
const calculosController = require('../controllers/calculosController');

router.post('/procesar', calculosController.procesar);

module.exports = router;
