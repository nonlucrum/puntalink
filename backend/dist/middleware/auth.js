"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET_KEY = process.env.JWT_SECRET || "clave_super_secreta";
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
        return res.status(403).json({ message: "Token requerido" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        req.user = payload;
        return next();
    }
    catch {
        return res.status(401).json({ message: "Token inválido o expirado" });
    }
};
exports.authMiddleware = authMiddleware;
