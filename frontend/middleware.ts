import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require specific roles
const roleRoutes: Record<string, string[]> = {
  '/dashboard/admin':   ['admin'],
  '/dashboard/teacher': ['teacher'],
  '/dashboard/student': ['student'],
  '/admin/analytics':   ['admin'],
  '/admin/logs':        ['admin'],
  '/admin/users':       ['admin'],
  '/admin/courses':     ['admin', 'teacher'],
  '/admin':             ['admin'],
  '/radar':             ['student'],
};

// Routes that require any authentication
const protectedPrefixes = [
  '/dashboard', '/courses', '/admin',
  '/messages', '/notifications', '/profile',
  '/help', '/radar', '/support',
];

function decodeJWT(token: string) {
  try {
    let base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    // Using atob instead of Buffer.from to ensure compatibility with Next.js Edge runtime
    const json = atob(base64);
    return JSON.parse(json);
  } catch { 
    return null; 
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const isProtected = protectedPrefixes.some(p => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // No token — redirect to login
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const decoded = decodeJWT(token);
  if (!decoded) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    const response = NextResponse.redirect(url);
    response.cookies.delete('token');
    return response;
  }

  // Check token expiry
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    const response = NextResponse.redirect(url);
    response.cookies.delete('token');
    return response;
  }

  // Check role-based access
  const sortedRoutes = Object.keys(roleRoutes).sort((a, b) => b.length - a.length);
  for (const route of sortedRoutes) {
    if (pathname.startsWith(route)) {
      if (!roleRoutes[route].includes(decoded.role)) {
        const url = request.nextUrl.clone();
        url.pathname = `/dashboard/${decoded.role}`;
        return NextResponse.redirect(url);
      }
      break; // Matched the most specific route, so stop checking others
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/courses/:path*',
    '/admin/:path*',
    '/messages/:path*',
    '/notifications/:path*',
    '/profile/:path*',
    '/help/:path*',
    '/radar/:path*',
    '/support/:path*',
  ],
};
