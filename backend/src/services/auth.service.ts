import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../db';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export type UserRow = {
  id: number;
  email: string;
  name: string | null;
  picture: string | null;
  provider: string;
  google_sub: string | null;
};

export async function verifyGoogleIdToken(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error('Invalid Google token');

  // Datos mínimos
  const email = payload.email;
  const name = payload.name ?? null;
  const picture = payload.picture ?? null;
  const sub = payload.sub; // identificador único de Google

  if (!email || !sub) throw new Error('Google token sin email/sub');

  return { email, name, picture, sub };
}

export async function upsertUserGoogle(p: { email: string; name: string | null; picture: string | null; sub: string }) {
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
  const { rows } = await pool.query<UserRow>(q, [p.email, p.name, p.picture, p.sub]);
  return rows[0];
}

export function signSessionJWT(user: UserRow) {
  const secret = process.env.JWT_SECRET!;
  // payload mínimo
  const payload = { uid: user.id, email: user.email, provider: user.provider };
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}
