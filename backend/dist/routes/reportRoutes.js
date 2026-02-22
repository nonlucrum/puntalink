"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const reportController_1 = require("../controllers/reportController");
const router = (0, express_1.Router)();
// Multer config: memory storage, 5MB max, only PNG/JPEG
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Solo se permiten imágenes PNG o JPEG.'));
        }
    },
});
// Conditional multer middleware: only parse if multipart
function conditionalUpload(req, res, next) {
    if (req.is('multipart/form-data')) {
        upload.single('image')(req, res, (err) => {
            if (err) {
                if (err instanceof multer_1.default.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({ ok: false, error: 'La imagen no debe superar 5MB.' });
                    }
                    return res.status(400).json({ ok: false, error: `Error de archivo: ${err.message}` });
                }
                return res.status(400).json({ ok: false, error: err.message });
            }
            next();
        });
    }
    else {
        next();
    }
}
// POST /api/informe/generar
router.post('/generar', conditionalUpload, (req, res) => {
    reportController_1.ReportController.generarInforme(req, res);
});
exports.default = router;
