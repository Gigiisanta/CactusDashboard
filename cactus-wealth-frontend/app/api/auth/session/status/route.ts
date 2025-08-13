import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  return NextResponse.json({ authenticated: Boolean(token) });
}


