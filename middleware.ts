import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'esaad_session';

// Helper to decode JWT payload safely in edge middleware
function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? parseJwtPayload(token) : null;

  // Support /auth/* endpoints as aliases for /api/auth/*
  if (pathname.startsWith('/auth/')) {
    const apiPath = pathname.replace('/auth/', '/api/auth/');
    return NextResponse.rewrite(new URL(apiPath, req.url));
  }

  // 1. Guard Admin Routes (/admin and /admin/*)
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
      // If already logged in as ADMIN, redirect directly to /admin dashboard
      if (token && payload && payload.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      // If logged in as regular user, redirect to user dashboard
      if (token && payload && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      // Otherwise allow access to admin login page
    } else {
      // All other /admin routes require authenticated ADMIN role
      if (!token || !payload || payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }
    }
  }

  // 2. Guard User Dashboard Routes
  const protectedUserPrefixes = [
    '/dashboard',
    '/new-order',
    '/orders',
    '/wallet',
    '/api-keys',
    '/profile',
    '/support',
  ];

  const isProtectedUserRoute = protectedUserPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtectedUserRoute) {
    if (!token || !payload) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. If logged in and visiting /login or /register, redirect to /dashboard
  if (pathname === '/login' || pathname === '/register') {
    if (token && payload) {
      if (payload.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // 4. Set standard security headers on response
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
