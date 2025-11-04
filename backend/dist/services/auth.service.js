"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleIdToken = verifyGoogleIdToken;
exports.upsertUserGoogle = upsertUserGoogle;
exports.signSessionJWT = signSessionJWT;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const db_1 = require("../db");
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
async function verifyGoogleIdToken(idToken) {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload)
        throw new Error('Invalid Google token');
    // Datos mínimos
    const email = payload.email;
    const name = payload.name ?? null;
    const picture = payload.picture ?? null;
    const sub = payload.sub; // identificador único de Google
    if (!email || !sub)
        throw new Error('Google token sin email/sub');
    return { email, name, picture, sub };
}
async function upsertUserGoogle(p) {
    const q = `
    INSERT INTO app_user (email, name, picture, provider, google_sub, last_login)
    VALUES ($1, $2, $3, 'google', $4, NOW())
    ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          picture = EXCLUDED.picture,
          last_login = NOW(),
          google_sub = EXCLUDED.google_sub
    RETURNING id, email, name, picture, provider, google_sub
  `;
    const { rows } = await db_1.pool.query(q, [p.email, p.name, p.picture, p.sub]);
    return rows[0];
}
function signSessionJWT(user) {
    const secret = process.env.JWT_SECRET;
    // payload mínimo
    const payload = { uid: user.id, email: user.email, provider: user.provider };
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '7d' });
}
