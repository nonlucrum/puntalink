const express = require('express');
const router = express.Router();
const informeController = require('../controllers/informeController');

router.post('/pdf', informeController.exportPDF);
router.post('/docx', informeController.exportDOCX);

module.exports = router;
