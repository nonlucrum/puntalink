"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const calculosController_1 = require("../controllers/calculosController");
const router = (0, express_1.Router)();
router.post('/panel/informe', calculosController_1.informePaneles);
exports.default = router;
