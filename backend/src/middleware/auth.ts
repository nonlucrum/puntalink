import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "clave_super_secreta";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Token requerido" });

  try {
    const payload = jwt.verify(token, SECRET_KEY) as any;
    (req as any).user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};
