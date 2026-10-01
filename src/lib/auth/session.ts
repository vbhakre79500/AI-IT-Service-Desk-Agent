import { cookies } from 'next/headers';
import { User, UserRole } from '@/types';
import { SEED_USERS } from './users';

const SESSION_COOKIE_NAME = 'autodesk_session_user';
const DEFAULT_USER_ID = 'usr_emp_01'; // Default: Sarah Connor (EMPLOYEE)

/**
 * Retrieves the current authenticated user on the server.
 * Uses cookies, falling back to the default Sarah Connor employee persona.
 */
export async function getAuthenticatedUser(): Promise<User> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value || DEFAULT_USER_ID;
    
    const user = SEED_USERS.find((u) => u.id === userId);
    if (user) {
      return user;
    }
  } catch {
    // If called outside request context (e.g. build time or test)
  }

  // Fallback to default employee
  return SEED_USERS[0];
}

/**
 * Sets the active user persona cookie (for demo/eval purposes)
 */
export async function setSessionUser(userId: string): Promise<User> {
  const user = SEED_USERS.find((u) => u.id === userId);
  if (!user) {
    throw new Error(`User ID '${userId}' not found.`);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, user.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
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
