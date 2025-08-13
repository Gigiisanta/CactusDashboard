import { NextRequest, NextResponse } from 'next/server';
import { getBackendApiUrl } from '@/lib/backend';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });

    const url = getBackendApiUrl('users/request-manager-change');
    const res = await fetch(url, {
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


