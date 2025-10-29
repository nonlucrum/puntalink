import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export type SessionPayload = {
  uid: number;
  email: string;
  name?: string;
  picture?: string;
 
  provider?: 'google' | 'local' | string;
};

export function signSession(payload: SessionPayload): string {

  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, SECRET) as SessionPayload;
}
