import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/catalog', '/dashboard', '/history', '/admin'];
const authRoutes = ['/login'];
const SESSION_COOKIE_NAME = 'mlms_session';

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/catalog', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/catalog/:path*', '/dashboard/:path*', '/history/:path*', '/admin/:path*', '/login'],
};
