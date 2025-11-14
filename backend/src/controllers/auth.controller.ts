// backend/src/auth.controller.ts
import { Request, Response } from 'express';
import pool from '../db';
import { verifyGoogleIdToken } from '../services/googleAuth';
import { signSession, verifySession } from '../utils/jwt';

const isProd = process.env.NODE_ENV === 'production';
const COOKIE_NAME = 'session';

function cookieOptions() {
  return {
    httpOnly: true as const,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    path: '/',
    // domain: isProd ? 'puntalink.inf.uach.cl' : undefined,
  };
}

export const postGoogle = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body || {};
    if (!credential || typeof credential !== 'string' || credential.length < 10) {
      return res.status(400).json({ ok: false, error: 'Falta/credencial inválida' });
    }

    // 1) Verificar token de Google
    const profile = await verifyGoogleIdToken(credential); // { email, name?, picture?, sub }

    // 2) Upsert usuario
    const { rows } = await pool.query(
      `
      INSERT INTO app_user (email, name, picture, provider, google_sub, last_login)
      VALUES ($1, $2, $3, 'google', $4, NOW())
      ON CONFLICT (email) DO UPDATE
        SET name = EXCLUDED.name,
            picture = EXCLUDED.picture,
            google_sub = EXCLUDED.google_sub,
            last_login = NOW(),
            updated_at = NOW()
      RETURNING id, email, name, picture, provider;
      `,
      [profile.email, profile.name ?? null, profile.picture ?? null, profile.sub ?? null]
    );
    const user = rows[0];

    // 3) Firmar sesión y setear cookie
    const token = signSession({
      uid: user.id,
      email: user.email,
      name: user.name ?? undefined,
      picture: user.picture ?? undefined,
      provider: user.provider ?? 'google',
    });

    res.cookie(COOKIE_NAME, token, cookieOptions());
    return res.json({ ok: true, user });
  } catch (err: any) {
    console.error('[AUTH] Google error:', err?.message || err);
    return res.status(401).json({ ok: false, error: 'No autorizado' });
  }
};

export const getMe = (req: Request, res: Response) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.json({ ok: true, user: null });

  try {
    const me = verifySession(token);
    return res.json({ ok: true, user: me });
  } catch {
    return res.json({ ok: true, user: null });
  }
};

export const postLogout = (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  return res.json({ ok: true });
};
