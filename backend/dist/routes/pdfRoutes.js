"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pdfController_1 = require("../controllers/pdfController");
const router = (0, express_1.Router)();
router.post('/panel/informe', pdfController_1.informePaneles);
exports.default = router;
