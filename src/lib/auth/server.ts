import { NextRequest, NextResponse } from 'next/server';
import { User, UserRole, Ticket } from '@/types';
import { getAuthenticatedUser, verifySessionToken, SESSION_COOKIE_NAME } from './session';
import { hasMinimumRole } from './rbac';

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

/**
 * Standard 401 Unauthorized JSON response
 */
export function unauthorizedResponse(message: string = 'Authentication required. Please log in.') {
  return NextResponse.json(
    { success: false, error: message, code: 'UNAUTHORIZED' },
    { status: 401 }
  );
}

/**
 * Standard 403 Forbidden JSON response
 */
export function forbiddenResponse(message: string = 'Access denied. Insufficient role permissions.') {
  return NextResponse.json(
    { success: false, error: message, code: 'FORBIDDEN' },
    { status: 403 }
  );
}

/**
 * Resolves the authenticated user from a NextRequest or cookies().
 * Checks request headers and cookies directly.
 */
export async function getRequestUser(req?: NextRequest): Promise<User | null> {
  if (req) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const session = await verifySessionToken(token);
      if (session) {
        const { SEED_USERS } = await import('./users');
        const user = SEED_USERS.find((u) => u.id === session.userId);
        if (user) {
          return { ...user, role: session.role };
        }
      }
    }
  }

  // Fallback to standard cookieStore lookup
  return await getAuthenticatedUser();
}

/**
 * Enforces that a request has an authenticated session.
 * Throws AuthError(401) if unauthenticated.
 */
export async function requireAuth(req?: NextRequest): Promise<User> {
  const user = await getRequestUser(req);
  if (!user) {
    throw new AuthError('Authentication required. Active session token missing or invalid.', 401);
  }
  return user;
}

/**
 * Enforces that the authenticated user possesses at least the required role rank.
 * Throws AuthError(401) if unauthenticated, or AuthError(403) if role is insufficient.
 */
export async function requireRole(requiredRole: UserRole, req?: NextRequest): Promise<User> {
  const user = await requireAuth(req);

  if (!hasMinimumRole(user.role, requiredRole)) {
    throw new AuthError(
      `Access denied: Operation requires '${requiredRole}' privileges, but active session has '${user.role}'.`,
      403
    );
  }

  return user;
}

/**
 * Enforces that the authenticated user has one of the explicitly allowed roles.
 */
export async function requireAnyRole(allowedRoles: UserRole[], req?: NextRequest): Promise<User> {
  const user = await requireAuth(req);

  if (!allowedRoles.includes(user.role)) {
    throw new AuthError(
      `Access denied: Operation requires one of [${allowedRoles.join(', ')}], but current user has '${user.role}'.`,
      403
    );
  }

  return user;
}

/**
 * Resource-level authorization: Determines whether a user is allowed to access/modify a ticket.
 * - IT_ADMIN and IT_AGENT can access all operational tickets.
 * - EMPLOYEE can access only tickets they created.
 */
export function checkTicketAccess(ticket: { creatorId: string }, user: User): boolean {
  if (user.role === 'IT_ADMIN' || user.role === 'IT_AGENT') {
    return true;
  }
  return ticket.creatorId === user.id;
}

/**
 * Convenience helper to return standard 401/403 responses if the error is an AuthError
 */
export function handleAuthError(error: any): NextResponse | null {
  if (error instanceof AuthError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
      },
      { status: error.statusCode }
    );
  }
  return null;
}

