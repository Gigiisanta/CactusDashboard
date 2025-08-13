import { NextResponse } from 'next/server';

function buildClearedResponse() {
  const res = NextResponse.json({ ok: true });
  const clear = (name: string) => res.cookies.set(name, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  // Nuestra cookie
  clear('access_token');
  // Posibles cookies de NextAuth
  clear('next-auth.session-token');
  clear('__Secure-next-auth.session-token');
  clear('next-auth.csrf-token');
  clear('__Host-next-auth.csrf-token');
  return res;
}

export async function POST() {
  return buildClearedResponse();
}

export async function GET() {
  // Permitir limpiado con GET para facilitar desde navegador
  return buildClearedResponse();
}


