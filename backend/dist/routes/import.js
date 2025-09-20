"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
/**
 * Parser mínimo:
 * - Si el TXT es JSON válido → devuelve ese JSON.
 * - Si NO es JSON → devuelve { raw } para que no rompa el flujo.
 *   (Puedes adaptar después a tu formato real).
 */
function parseTxt(txt) {
    const raw = txt.trim();
    try {
        return JSON.parse(raw);
    }
    catch {
        return { raw }; // <- sin “panelplus”, solo el contenido crudo
    }
}
// Acepta POST /  y POST /txt  dentro del mismo router
router.post(['/', '/txt'], upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ ok: false, error: 'No se recibió archivo.' });
    }
    const txt = req.file.buffer.toString('utf-8');
    const data = parseTxt(txt);
    return res.json({ ok: true, data });
});
exports.default = router;
