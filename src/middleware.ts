import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';

/**
 * Server-side route protection middleware for Next.js App Router.
 * Protects routes based on authenticated role and prevents privilege escalation.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Identify protected routes
  const isAdminRoute = pathname.startsWith('/admin');
  const isItDeskRoute = pathname.startsWith('/it-desk');
  const isEmployeeRoute = pathname.startsWith('/employee');
  const isTicketRoute = pathname.startsWith('/tickets/');

  // If path is public (e.g. landing page '/', '/login', '/access-denied', static files, api routes)
  if (!isAdminRoute && !isItDeskRoute && !isEmployeeRoute && !isTicketRoute) {
    return NextResponse.next();
  }

  // 2. Read and verify session token
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // 3. Unauthenticated access check
  if (!session) {
    // If accessing a protected route without session, redirect to login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { role } = session;

  // 4. Role-based route enforcement
  // /admin requires IT_ADMIN
  if (isAdminRoute) {
    if (role !== 'IT_ADMIN') {
      const deniedUrl = new URL('/access-denied', req.url);
      deniedUrl.searchParams.set('required', 'IT_ADMIN');
      deniedUrl.searchParams.set('current', role);
      deniedUrl.searchParams.set('target', pathname);
      return NextResponse.redirect(deniedUrl);
    }
  }

  // /it-desk requires IT_AGENT or IT_ADMIN
  if (isItDeskRoute) {
    if (role !== 'IT_AGENT' && role !== 'IT_ADMIN') {
      const deniedUrl = new URL('/access-denied', req.url);
      deniedUrl.searchParams.set('required', 'IT_AGENT');
      deniedUrl.searchParams.set('current', role);
      deniedUrl.searchParams.set('target', pathname);
      return NextResponse.redirect(deniedUrl);
    }
  }

  // User is authorized for this route
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/it-desk/:path*',
    '/employee/:path*',
    '/tickets/:path*',
  ],
};
