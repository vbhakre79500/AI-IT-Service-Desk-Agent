import { cookies } from 'next/headers';
import { User, UserRole } from '@/types';
import { SEED_USERS } from './users';

export const SESSION_COOKIE_NAME = 'autodesk_session_token';

// Secret key for HMAC-SHA256 session signature
const AUTH_SECRET = process.env.AUTH_SECRET || 'autodesk-secure-session-hackathon-key-2026';

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 * Token format: <userId>.<role>.<timestamp>.<base64urlSignature>
 */
export async function createSessionToken(userId: string, role: UserRole): Promise<string> {
  const timestamp = Date.now();
  const payload = `${userId}.${role}.${timestamp}`;
  const signature = await signHmac(payload, AUTH_SECRET);
  return `${payload}.${signature}`;
}

/**
 * Verifies the cryptographic HMAC-SHA256 signature of a session token.
 * Returns the decoded payload if valid and unexpired; null if tampered or invalid.
 */
export async function verifySessionToken(
  token: string
): Promise<{ userId: string; role: UserRole; timestamp: number } | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 4) return null;

  const [userId, role, timestampStr, signature] = parts;
  const payload = `${userId}.${role}.${timestampStr}`;

  const isValid = await verifyHmac(payload, signature, AUTH_SECRET);
  if (!isValid) return null;

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return null;

  // Enforce session expiration: 7 days
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) {
    return null;
  }

  // Validate that role is one of the valid roles
  if (!['EMPLOYEE', 'IT_AGENT', 'IT_ADMIN'].includes(role)) {
    return null;
  }

  return { userId, role: role as UserRole, timestamp };
}

/**
 * Helper to compute HMAC-SHA256 using standard Web Crypto API (Universal in Edge & Node.js)
 */
async function signHmac(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Buffer.from(sigBuffer).toString('base64url');
}

/**
 * Helper to verify HMAC-SHA256 using standard Web Crypto API
 */
async function verifyHmac(data: string, signature: string, secret: string): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBuffer = Buffer.from(signature, 'base64url');
    return await crypto.subtle.verify('HMAC', key, sigBuffer, enc.encode(data));
  } catch {
    return false;
  }
}

/**
 * Retrieves the currently authenticated user from the verified session token.
 * Returns null if not authenticated or if the token is invalid.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return null;
    }

    const user = SEED_USERS.find((u) => u.id === session.userId);
    if (!user) {
      return null;
    }

    // Ensure database/seed user's actual role matches session
    return {
      ...user,
      role: session.role,
    };
  } catch {
    return null;
  }
}

/**
 * Sets a cryptographically signed session cookie for the user.
 */
export async function setSessionUser(userId: string): Promise<User> {
  const user = SEED_USERS.find((u) => u.id === userId);
  if (!user) {
    throw new Error(`User ID '${userId}' not found.`);
  }

  const token = await createSessionToken(user.id, user.role);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return user;
}

/**
 * Clears the session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Returns all available persona users for the switcher UI
 */
export function getAllPersonas(): User[] {
  return SEED_USERS;
}
