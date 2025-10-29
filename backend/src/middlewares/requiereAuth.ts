import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.session;
  if (!token) return res.status(401).json({ ok: false, error: 'No auth' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // @ts-ignore
    req.user = decoded; // { uid, email, provider }
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Token inválido' });
  }
}
