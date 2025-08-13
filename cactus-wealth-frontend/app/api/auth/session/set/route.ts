export async function POST(request: Request) {
  try {
    const { access_token, expires_in } = await request.json();
    const token = typeof access_token === 'string' ? access_token : '';
    const maxAge = typeof expires_in === 'number' && expires_in > 0 ? expires_in : 60 * 60 * 24;

    const cookie = [
      `access_token=${token}`,
      'Path=/',
      `Max-Age=${maxAge}`,
      'HttpOnly',
      'SameSite=Lax',
      process.env.NODE_ENV === 'production' ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; ');

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'failed_to_set_session', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


