import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Eğer /eventra/eventra gibi çift basePath varsa, düzelt
  if (pathname.startsWith('/eventra/eventra')) {
    const newPath = pathname.replace('/eventra/eventra', '/eventra');
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // Eğer sadece /eventra ise ve sonunda / yoksa, /eventra/ olarak yönlendir
  if (pathname === '/eventra') {
    return NextResponse.redirect(new URL('/eventra/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

