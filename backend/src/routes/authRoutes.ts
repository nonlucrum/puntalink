import { Router } from 'express';
import { z } from 'zod';
import pool from '../db';
import { verifyGoogleIdToken } from '../services/googleAuth';
import { signSession, verifySession } from '../utils/jwt';
import { getMe, postGoogle, postLogout } from '../controllers/auth.controller';

const router = Router();

const GoogleLoginBody = z.object({
  credential: z.string().min(10),
});

const isProd = process.env.NODE_ENV === 'production';
const COOKIE_NAME = 'session';

function cookieOptions() {
  return {
    httpOnly: true as const,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
    // domain: isProd ? 'puntalink.inf.uach.cl' : undefined,
  };
}

/**
 * ====== RUTAS INLINE (LEGACY / DEBUG) ======
 * Se renombran a *_inline para no chocar con las rutas oficiales del controller.
 * Puedes probarlas en:
 *   POST   /api/auth/google-inline
 *   GET    /api/auth/me-inline
 *   POST   /api/auth/logout-inline
 */
router.post('/google-inline', async (req, res) => {
  try {
    const { credential } = GoogleLoginBody.parse(req.body);
    const profile = await verifyGoogleIdToken(credential);
    // profile: { email, name?, picture?, sub }

    const result = await pool.query(
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

    const user = result.rows[0];

    const session = signSession({
      uid: user.id,
      email: user.email,
      name: user.name ?? undefined,
      picture: user.picture ?? undefined,
      provider: user.provider ?? 'google',
    });

    res.cookie(COOKIE_NAME, session, cookieOptions());
    return res.json({ ok: true, user });
  } catch (err: any) {
    console.error('[AUTH] Error /google-inline:', err?.message || err);
    return res.status(400).json({ ok: false, error: err?.message ?? 'Error en login' });
  }
});

router.get('/me-inline', (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(200).json({ ok: true, user: null });

  try {
    const me = verifySession(token);
    return res.json({ ok: true, user: me });
  } catch {
    return res.json({ ok: true, user: null });
  }
});

router.post('/logout-inline', (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.json({ ok: true });
});

/**
 * ====== RUTAS OFICIALES (CONTROLLER) ======
 * Estas son las que debe usar el frontend en producción:
 *   POST   /api/auth/google
 *   GET    /api/auth/me
 *   POST   /api/auth/logout
 */
router.post('/google', postGoogle);
router.get('/me', getMe);
router.post('/logout', postLogout);

export default router;
