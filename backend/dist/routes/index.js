"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const import_1 = __importDefault(require("./import"));
const calculosRoutes_1 = __importDefault(require("./calculosRoutes"));
const pdfRoutes_1 = __importDefault(require("./pdfRoutes"));
const panelesRoutes_1 = __importDefault(require("./panelesRoutes"));
const projectRoutes_1 = __importDefault(require("./projectRoutes"));
const grupoMuertoRoutes_1 = __importDefault(require("./grupoMuertoRoutes"));
const router = (0, express_1.Router)();
// Middleware de logging para el router principal
router.use((req, res, next) => {
    console.log(`[ROUTES - index] ${req.method} ${req.originalUrl}`);
    next();
});
// Rutas principales
router.get('/', (req, res) => {
    console.log('[ROUTES - index] GET / - Página principal');
    res.send('index OK');
});
// Rutas de importación
router.use('/importar-muros', (req, res, next) => {
    console.log('[ROUTES - index] Redirigiendo a /importar-muros');
    next();
}, import_1.default);
// Rutas de cálculos
router.use('/calculos', (req, res, next) => {
    console.log('[ROUTES - index] Redirigiendo a /calculos');
    next();
}, calculosRoutes_1.default);
// Rutas de PDF
router.use('/pdf', (req, res, next) => {
    console.log('[ROUTES - index] Redirigiendo a /pdf');
    next();
}, pdfRoutes_1.default);
// Rutas de paneles
router.use('/paneles', (req, res, next) => {
    console.log('[routes - index] Redirigiendo a /paneles');
    next();
}, panelesRoutes_1.default);
// Rutas de proyecto
router.use('/proyecto', (req, res, next) => {
    console.log('[ROUTES - index] Redirigiendo a /proyecto');
    next();
}, projectRoutes_1.default);
// Rutas de grupos de muertos
router.use('/grupos-muertos', (req, res, next) => {
    console.log('[ROUTES - index] Redirigiendo a /grupos-muertos');
    next();
}, grupoMuertoRoutes_1.default);
exports.default = router;
