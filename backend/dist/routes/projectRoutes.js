"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const projectController_1 = require("../controllers/projectController");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'text/plain') {
            cb(new Error('Solo archivos .txt'));
        }
        if (file.originalname.length > 255) {
            cb(new Error('Nombre muy largo'));
        }
        cb(null, true);
    }
});
const router = (0, express_1.Router)();
// Middleware de logging para rutas de proyecto
router.use((req, res, next) => {
    console.log(`[routes - proyecto] ${req.method} ${req.originalUrl}`);
    next();
});
// POST /api/proyecto/crear -> crea un nuevo proyecto
router.post("/crear", projectController_1.crearProyecto);
router.put("/actualizar", projectController_1.actualizarProyecto);
router.get("/listar", projectController_1.listarProyectos);
router.get("/cargar", projectController_1.cargarProyecto);
router.post("/guardar-version", projectController_1.nuevaVersion);
router.delete("/eliminar", projectController_1.eliminarProyecto);
router.post(['/guardar-txt'], upload.single('file'), (req, res) => {
    (0, projectController_1.guardarTXT)(req, res);
});
exports.default = router;
