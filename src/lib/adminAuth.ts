import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

const ADMIN_COOKIE_NAME = 'admin_session';
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 12;

type AdminSessionPayload = {
  email: string;
  issuedAt: number;
  expiresAt: number;
};

export type AdminSession = {
  email: string;
  isAdmin: true;
  name: string;
  role: 'ADMIN';
};

function getAdminEmail() {
  return process.env.ADMIN_EMAIL || 'dantekein90151@gmail.com';
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || '';
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || '';
}

function signValue(value: string) {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error('Falta ADMIN_SESSION_SECRET o NEXTAUTH_SECRET para proteger la sesión admin');
  }

  return createHmac('sha256', secret).update(value).digest('base64url');
}

function parseCookies(cookieHeader: string | null) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey) {
      return acc;
    }

    acc[rawKey] = rawValue.join('=');
    return acc;
  }, {});
}

function encodeSession(payload: AdminSessionPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function decodeSession(rawSession: string) {
  const [encodedPayload, signature] = rawSession.split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  if (signature.length !== expectedSignature.length) {
    return null;
  }
  const matches = timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!matches) {
    return null;
  }

  const payload = JSON.parse(
    Buffer.from(encodedPayload, 'base64url').toString('utf8')
  ) as AdminSessionPayload;

  if (!payload.email || payload.expiresAt < Date.now()) {
    return null;
  }

  return payload;
}

export function getAdminAuthConfig() {
  return {
    adminEmail: getAdminEmail(),
    adminPassword: getAdminPassword(),
  };
}

export function createAdminSession(email: string): AdminSession {
  return {
    email,
    isAdmin: true,
    name: 'Administrador',
    role: 'ADMIN',
  };
}

export function setAdminSessionCookie(response: NextResponse, email: string) {
  const now = Date.now();
  const value = encodeSession({
    email,
    issuedAt: now,
    expiresAt: now + ADMIN_SESSION_TTL_MS,
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function getAdminSessionFromRequest(req: Request): AdminSession | null {
  const cookies = parseCookies(req.headers.get('cookie'));
  const rawSession = cookies[ADMIN_COOKIE_NAME];

  if (!rawSession) {
    return null;
  }

  const payload = decodeSession(rawSession);
  const { adminEmail } = getAdminAuthConfig();

  if (!payload || payload.email !== adminEmail) {
    return null;
  }

  return createAdminSession(payload.email);
}

export function requireAdminSession(req: Request) {
  const session = getAdminSessionFromRequest(req);

  if (!session) {
    return {
      error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }),
    };
  }

  return { session };
}
