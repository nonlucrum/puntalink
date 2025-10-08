"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const calculosController_1 = require("../controllers/calculosController");
const router = (0, express_1.Router)();
// Rutas existentes para estimación de paneles
router.post('/panel/estimacion', calculosController_1.estimacionPanel);
router.post('/panel/informe', calculosController_1.informePaneles);
// Rutas nuevas para cálculo de viento según Excel y diagramas
// Sección 1: Parámetros por defecto de viento (Excel "braces" valores típicos)
router.get('/viento/parametros-defecto', calculosController_1.parametrosVientoDefecto);
// Sección 1-2: Calcular cargas de viento en muros (implementa fórmulas del diagrama)
router.post('/viento/calcular-muros', calculosController_1.calculoVientoMuros);
exports.default = router;
