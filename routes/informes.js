const express = require('express');
const router = express.Router();
const informeController = require('../controllers/informeController');

router.post('/export/pdf', informeController.exportPDF);
router.post('/export/docx', informeController.exportDOCX);

module.exports = router;
