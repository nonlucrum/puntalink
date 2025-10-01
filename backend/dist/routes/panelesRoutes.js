"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const panelesController_1 = require("../controllers/panelesController");
const router = (0, express_1.Router)();
// Middleware de logging para rutas de paneles
router.use((req, res, next) => {
    console.log(`[routes - paneles] ${req.method} ${req.originalUrl}`);
    next();
});
// POST /api/paneles/calcular  -> calcula y devuelve arreglo
router.post("/calcular", (req, res) => {
    console.log('[routes - paneles] POST /calcular - Llamando a PanelesController.calcular');
    panelesController_1.PanelesController.calcular(req, res);
});
// POST /api/paneles/pdf  -> genera y descarga PDF
router.post("/pdf", (req, res) => {
    console.log('[routes - paneles] POST /pdf - Llamando a PanelesController.pdf');
    panelesController_1.PanelesController.pdf(req, res);
});
exports.default = router;
