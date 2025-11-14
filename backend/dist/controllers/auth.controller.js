"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postLogout = exports.getMe = exports.postGoogle = void 0;
const db_1 = __importDefault(require("../db"));
const googleAuth_1 = require("../services/googleAuth");
const jwt_1 = require("../utils/jwt");
const isProd = process.env.NODE_ENV === 'production';
const COOKIE_NAME = 'session';
function cookieOptions() {
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? 'none' : 'lax'),
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
        path: '/',
        // domain: isProd ? 'puntalink.inf.uach.cl' : undefined,
    };
}
const postGoogle = async (req, res) => {
    try {
        const { credential } = req.body || {};
        if (!credential || typeof credential !== 'string' || credential.length < 10) {
            return res.status(400).json({ ok: false, error: 'Falta/credencial inválida' });
        }
        // 1) Verificar token de Google
        const profile = await (0, googleAuth_1.verifyGoogleIdToken)(credential); // { email, name?, picture?, sub }
        // 2) Upsert usuario
        const { rows } = await db_1.default.query(`
      INSERT INTO app_user (email, name, picture, provider, google_sub, last_login)
      VALUES ($1, $2, $3, 'google', $4, NOW())
      ON CONFLICT (email) DO UPDATE
        SET name = EXCLUDED.name,
            picture = EXCLUDED.picture,
            google_sub = EXCLUDED.google_sub,
            last_login = NOW(),
            updated_at = NOW()
      RETURNING id, email, name, picture, provider;
      `, [profile.email, profile.name ?? null, profile.picture ?? null, profile.sub ?? null]);
        const user = rows[0];
        // 3) Firmar sesión y setear cookie
        const token = (0, jwt_1.signSession)({
            uid: user.id,
            email: user.email,
            name: user.name ?? undefined,
            picture: user.picture ?? undefined,
            provider: user.provider ?? 'google',
        });
        res.cookie(COOKIE_NAME, token, cookieOptions());
        return res.json({ ok: true, user });
    }
    catch (err) {
        console.error('[AUTH] Google error:', err?.message || err);
        return res.status(401).json({ ok: false, error: 'No autorizado' });
    }
};
exports.postGoogle = postGoogle;
const getMe = (req, res) => {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token)
        return res.json({ ok: true, user: null });
    try {
        const me = (0, jwt_1.verifySession)(token);
        return res.json({ ok: true, user: me });
    }
    catch {
        return res.json({ ok: true, user: null });
    }
};
exports.getMe = getMe;
const postLogout = (_req, res) => {
    res.clearCookie(COOKIE_NAME, cookieOptions());
    return res.json({ ok: true });
};
exports.postLogout = postLogout;
