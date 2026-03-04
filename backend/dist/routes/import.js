"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const importController_1 = require("../controllers/importController");
const importController_2 = require("../controllers/importController");
const importController_3 = require("../controllers/importController");
const importController_4 = require("../controllers/importController");
const router = (0, express_1.Router)();
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
// Middleware de logging para rutas de import
router.use((req, res, next) => {
    console.log(`[routes - import] ${req.method} ${req.originalUrl}`);
    next();
});
router.post(['/', '/txt'], upload.single('file'), (req, res) => {
    console.log('[routes - import] POST / - Llamando a importarMuros');
    (0, importController_1.importarMuros)(req, res);
});
router.delete(['/', '/cancelar-import'], (req, res) => {
    console.log('[routes - import] DELETE / - Llamando a cancelarImport');
    (0, importController_2.cancelarImport)(req, res);
});
router.get('/muros', (req, res) => {
    console.log('[routes - import] GET /muros - Llamando a getMuros');
    (0, importController_3.getMuros)(req, res);
});
router.delete('/muros/batch-delete', (req, res) => {
    console.log('[routes - import] DELETE /muros/batch-delete - Llamando a deleteMurosBatch');
    (0, importController_4.deleteMurosBatch)(req, res);
});
exports.default = router;
