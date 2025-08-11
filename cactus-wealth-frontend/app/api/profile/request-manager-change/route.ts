import { NextRequest, NextResponse } from 'next/server';

const ENV_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_BASE_URL = 'http://localhost:8000';
const BACKEND_URL = ENV_BASE_URL || DEFAULT_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });

    const res = await fetch(`${BACKEND_URL}/api/v1/users/request-manager-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });
    const data = await res.text();
    if (!res.ok) return NextResponse.json({ error: 'Failed', details: data }, { status: res.status });
    return NextResponse.json({ message: 'ok' });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


