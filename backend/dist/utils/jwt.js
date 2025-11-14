"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signSession = signSession;
exports.verifySession = verifySession;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
function signSession(payload) {
    return jsonwebtoken_1.default.sign(payload, SECRET, { expiresIn: '7d' });
}
function verifySession(token) {
    return jsonwebtoken_1.default.verify(token, SECRET);
}
