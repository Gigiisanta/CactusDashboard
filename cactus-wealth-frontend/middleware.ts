import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Fallback: allow access when custom access_token cookie is present
  const accessTokenCookie = request.cookies.get('access_token')?.value;
  
  // Si no hay token y está intentando acceder a una ruta protegida
  const protectedPrefixes = ['/dashboard', '/clients', '/admin', '/reports'];
  if (
    !token &&
    !accessTokenCookie &&
    protectedPrefixes.some((p) => request.nextUrl.pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // Si hay token (NextAuth) o cookie propia y está intentando acceder al login, redirigir al dashboard
  if ((token || accessTokenCookie) && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/auth/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/clients/:path*',
    '/admin/:path*',
    '/reports/:path*',
    '/login',
    '/auth/login',
  ],
};