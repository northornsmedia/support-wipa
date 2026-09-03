import crypto from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || 'wipa-support-global-secret-key-2026-auth';

export interface AgentUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export function createSessionToken(agent: AgentUser): string {
  const payload = JSON.stringify({
    ...agent,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000
  });
  const data = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifySessionToken(token?: string | null): AgentUser | null {
  if (!token || !token.includes('.')) return null;
  const [data, signature] = token.split('.');
  const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return {
      id: payload.id,
      username: payload.username,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      avatar: payload.avatar
    };
  } catch {
    return null;
  }
}
