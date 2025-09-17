import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { users, User } from "../models/User";

const SECRET_KEY = process.env.JWT_SECRET || "clave_super_secreta";

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "username y password son requeridos" });

  const existing = users.find(u => u.username === username);
  if (existing) return res.status(400).json({ message: "Usuario ya existe" });

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: User = { id: users.length + 1, username, passwordHash };
  users.push(newUser);

  return res.json({ message: "Usuario registrado con éxito" });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).json({ message: "Credenciales inválidas" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ message: "Credenciales inválidas" });

  const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });
  return res.json({ message: "Login exitoso", token });
};
