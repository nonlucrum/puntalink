"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const muroController_1 = require("../controllers/muroController");
const router = (0, express_1.Router)();
// CRUD muros manuales
router.post('/manual', muroController_1.addManualMuroHandler);
router.put('/manual/:pid', muroController_1.updateManualMuroHandler);
router.delete('/manual/:pid', muroController_1.deleteManualMuroHandler);
// Reordenamiento
router.put('/reorder', muroController_1.reorderMurosHandler);
// Consulta
router.get('/project/:pk_proyecto', muroController_1.getMurosHandler);
exports.default = router;
