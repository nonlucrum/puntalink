"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projectController_1 = require("../controllers/projectController");
const projectController_2 = require("../controllers/projectController");
const projectController_3 = require("../controllers/projectController");
const router = (0, express_1.Router)();
// Middleware de logging para rutas de proyecto
router.use((req, res, next) => {
    console.log(`[routes - proyecto] ${req.method} ${req.originalUrl}`);
    next();
});
// POST /api/proyecto/crear -> crea un nuevo proyecto
router.post("/crear", projectController_1.crearProyecto);
router.put("/actualizar", projectController_2.actualizarProyecto);
router.get("/listar", projectController_3.listarProyectos);
exports.default = router;
