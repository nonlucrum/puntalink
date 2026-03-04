"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const grupoMuertoController_1 = require("../controllers/grupoMuertoController");
const router = (0, express_1.Router)();
// Rutas para grupos de muertos
// POST /api/grupos-muertos/:pk_proyecto - Crear/actualizar grupos con configuración
router.post('/:pk_proyecto', grupoMuertoController_1.crearActualizarGrupos);
// GET /api/grupos-muertos/:pk_proyecto - Obtener grupos de un proyecto
router.get('/:pk_proyecto', grupoMuertoController_1.obtenerGrupos);
// PUT /api/grupos-muertos/:pid/profundidad - Actualizar solo profundidad
router.put('/:pid/profundidad', grupoMuertoController_1.actualizarProfundidad);
// PUT /api/grupos-muertos/:pid/dimensiones - Actualizar dimensiones completas
router.put('/:pid/dimensiones', grupoMuertoController_1.actualizarDimensiones);
// DELETE /api/grupos-muertos/:pk_proyecto - Eliminar grupos de un proyecto
router.delete('/:pk_proyecto', grupoMuertoController_1.eliminarGrupos);
exports.default = router;
