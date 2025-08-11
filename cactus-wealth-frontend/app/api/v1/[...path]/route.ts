import { NextRequest, NextResponse } from 'next/server';

// Flexible backend URL - supports both env var names and docker-compose service name
const ENV_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_BASE_URL = 'http://localhost:8000';
const BACKEND_BASE_URL = ENV_BASE_URL || DEFAULT_BASE_URL;
// Ensure we don't duplicate /api/v1 in the URL
const BACKEND_URL = BACKEND_BASE_URL.endsWith('/api/v1') ? BACKEND_BASE_URL.replace('/api/v1', '') : BACKEND_BASE_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const url = `${BACKEND_URL}/api/v1/${path}`;
  
  try {
    console.log(`[PROXY] GET ${url}`);
    // Attach Authorization from cookie if not explicitly provided
    const authorization = request.headers.get('authorization') ||
      (request.cookies.get('access_token')?.value ? `Bearer ${request.cookies.get('access_token')!.value}` : undefined);
    const cookie = request.headers.get('cookie') || undefined;

    const proxyHeaders: HeadersInit = {};
    if (authorization) (proxyHeaders as Record<string, string>)['Authorization'] = authorization;
    if (cookie) (proxyHeaders as Record<string, string>)['Cookie'] = cookie;

    const response = await fetch(url, { method: 'GET', headers: proxyHeaders });
    const resHeaders = new Headers(response.headers);
    return new NextResponse(response.body, { status: response.status, headers: resHeaders });
  } catch (error) {
    console.error(`[PROXY ERROR] GET ${url}:`, error);
    return NextResponse.json(
      { 
        error: 'Backend connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        backend_url: BACKEND_URL,
        attempted_url: url
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const url = `${BACKEND_URL}/api/v1/${path}`;
  
  try {
    console.log(`[PROXY] POST ${url}`);
    // Preserve original content-type and stream body as-is (supports JSON, urlencoded, multipart)
    const contentType = request.headers.get('content-type') || undefined;
    const authorization = request.headers.get('authorization') ||
      (request.cookies.get('access_token')?.value ? `Bearer ${request.cookies.get('access_token')!.value}` : undefined);
    const cookie = request.headers.get('cookie') || undefined;

    const proxyHeaders: HeadersInit = {};
    if (contentType) (proxyHeaders as Record<string, string>)['Content-Type'] = contentType;
    if (authorization) (proxyHeaders as Record<string, string>)['Authorization'] = authorization;
    if (cookie) (proxyHeaders as Record<string, string>)['Cookie'] = cookie;

    let response: Response;
    // Optimize for common types to avoid streaming issues
    if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
      const textBody = await request.text();
      const contentLength = new TextEncoder().encode(textBody).length.toString();
      (proxyHeaders as Record<string, string>)['Content-Length'] = contentLength;
      response = await fetch(url, { method: 'POST', headers: proxyHeaders, body: textBody });
    } else if (contentType && contentType.includes('application/json')) {
      const jsonText = await request.text();
      response = await fetch(url, { method: 'POST', headers: proxyHeaders, body: jsonText });
    } else {
      response = await fetch(url, {
        method: 'POST',
        headers: proxyHeaders,
        // Required by Node/Undici when sending a ReadableStream as body
        // @ts-expect-error Node/Undici requires duplex when streaming body in edge runtimes
        duplex: 'half',
        body: request.body,
      });
    }
    
    // Pass-through response (including JSON bodies)
    const resHeaders = new Headers(response.headers);
    return new NextResponse(response.body, { status: response.status, headers: resHeaders });
  } catch (error) {
    console.error(`[PROXY ERROR] POST ${url}:`, error);
    return NextResponse.json(
      { 
        error: 'Backend connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        backend_url: BACKEND_URL,
        attempted_url: url
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const url = `${BACKEND_URL}/api/v1/${path}`;
  
  try {
    console.log(`[PROXY] PUT ${url}`);
    // Preserve content type and stream raw body
    const contentType = request.headers.get('content-type') || undefined;
    const authorization = request.headers.get('authorization') ||
      (request.cookies.get('access_token')?.value ? `Bearer ${request.cookies.get('access_token')!.value}` : undefined);
    const cookie = request.headers.get('cookie') || undefined;

    const proxyHeaders: HeadersInit = {};
    if (contentType) (proxyHeaders as Record<string, string>)['Content-Type'] = contentType;
    if (authorization) (proxyHeaders as Record<string, string>)['Authorization'] = authorization;
    if (cookie) (proxyHeaders as Record<string, string>)['Cookie'] = cookie;

    let response: Response;
    if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
      const textBody = await request.text();
      const contentLength = new TextEncoder().encode(textBody).length.toString();
      (proxyHeaders as Record<string, string>)['Content-Length'] = contentLength;
      response = await fetch(url, { method: 'PUT', headers: proxyHeaders, body: textBody });
    } else if (contentType && contentType.includes('application/json')) {
      const jsonText = await request.text();
      response = await fetch(url, { method: 'PUT', headers: proxyHeaders, body: jsonText });
    } else {
      response = await fetch(url, {
        method: 'PUT',
        headers: proxyHeaders,
        // @ts-expect-error Node/Undici requires duplex when streaming body in edge runtimes
        duplex: 'half',
        body: request.body,
      });
    }
    
    const resHeaders = new Headers(response.headers);
    return new NextResponse(response.body, { status: response.status, headers: resHeaders });
  } catch (error) {
    console.error(`[PROXY ERROR] PUT ${url}:`, error);
    return NextResponse.json(
      { 
        error: 'Backend connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        backend_url: BACKEND_URL,
        attempted_url: url
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const url = `${BACKEND_URL}/api/v1/${path}`;
  
  try {
    console.log(`[PROXY] DELETE ${url}`);
    const authorization = request.headers.get('authorization') || undefined;
    const cookie = request.headers.get('cookie') || undefined;

    const proxyHeaders: HeadersInit = {};
    if (authorization) (proxyHeaders as Record<string, string>)['Authorization'] = authorization;
    if (cookie) (proxyHeaders as Record<string, string>)['Cookie'] = cookie;

    const response = await fetch(url, { method: 'DELETE', headers: proxyHeaders });
    const resHeaders = new Headers(response.headers);
    return new NextResponse(response.body, { status: response.status, headers: resHeaders });
  } catch (error) {
    console.error(`[PROXY ERROR] DELETE ${url}:`, error);
    return NextResponse.json(
      { 
        error: 'Backend connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        backend_url: BACKEND_URL,
        attempted_url: url
      },
      { status: 500 }
    );
  }
}