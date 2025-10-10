"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// CÓDIGO BASURA - Importaciones comentadas porque las funciones están duplicadas
// import { estimacionPanel, informePaneles, parametrosVientoDefecto, calculoVientoMuros } from '../controllers/calculosController';
const calculosController_1 = require("../controllers/calculosController");
const router = (0, express_1.Router)();
// CÓDIGO BASURA - Rutas comentadas porque las funciones están duplicadas, usar pdfController
// router.post('/panel/estimacion', estimacionPanel);
// router.post('/panel/informe', informePaneles);
// Rutas nuevas para cálculo de viento según Excel y diagramas
// Sección 1: Parámetros por defecto de viento (Excel "braces" valores típicos)
router.get('/viento/parametros-defecto', calculosController_1.parametrosVientoDefecto);
// Sección 1-2: Calcular cargas de viento en muros (implementa fórmulas del diagrama)
router.post('/viento/calcular-muros', calculosController_1.calculoVientoMuros);
exports.default = router;
