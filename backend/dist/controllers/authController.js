"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const SECRET_KEY = process.env.JWT_SECRET || "clave_super_secreta";
const register = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ message: "username y password son requeridos" });
    const existing = User_1.users.find(u => u.username === username);
    if (existing)
        return res.status(400).json({ message: "Usuario ya existe" });
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const newUser = { id: User_1.users.length + 1, username, passwordHash };
    User_1.users.push(newUser);
    return res.json({ message: "Usuario registrado con éxito" });
};
exports.register = register;
const login = async (req, res) => {
    const { username, password } = req.body;
    const user = User_1.users.find(u => u.username === username);
    if (!user)
        return res.status(400).json({ message: "Credenciales inválidas" });
    const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok)
        return res.status(400).json({ message: "Credenciales inválidas" });
    const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });
    return res.json({ message: "Login exitoso", token });
};
exports.login = login;
