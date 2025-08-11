import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { access_token, expires_in } = await request.json();
    if (!access_token) {
      return NextResponse.json({ error: 'access_token is required' }, { status: 400 });
    }

    const maxAge = typeof expires_in === 'number' && expires_in > 0 ? expires_in : 60 * 60 * 24; // 24h
    const response = NextResponse.json({ ok: true });

    response.cookies.set('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'failed_to_set_session', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


