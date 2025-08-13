import { NextRequest, NextResponse } from 'next/server';

// Flexible backend URL - supports both env var names and docker-compose service name
const ENV_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_BASE_URL = 'http://localhost:8000';
const BACKEND_BASE_URL = ENV_BASE_URL || DEFAULT_BASE_URL;
// Ensure we don't duplicate /api/v1 in the URL
const BACKEND_URL = BACKEND_BASE_URL.endsWith('/api/v1') ? BACKEND_BASE_URL.replace('/api/v1', '') : BACKEND_BASE_URL;
// Reduce noisy logging in production; enable with DEBUG_PROXY=true or in development
const DEBUG_PROXY = process.env.NODE_ENV !== 'production' && (process.env.DEBUG_PROXY === 'true' || process.env.NODE_ENV === 'development');
const PROXY_TIMEOUT_MS = Number(process.env.PROXY_TIMEOUT_MS || 12000);
const PROXY_MAX_RETRIES = Number(process.env.PROXY_MAX_RETRIES || 1);
const PROXY_RETRY_BASE_DELAY_MS = Number(process.env.PROXY_RETRY_BASE_DELAY_MS || 250);

function withTimeout(signal?: AbortSignal): { signal: AbortSignal; timeoutId: NodeJS.Timeout } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error(`Proxy request timed out after ${PROXY_TIMEOUT_MS}ms`)), PROXY_TIMEOUT_MS);
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }
  return { signal: controller.signal, timeoutId };
}

function shouldRetry(status: number): boolean {
  // Retry on network errors is handled by catch; here we retry on 502/503/504
  return status === 502 || status === 503 || status === 504;
}

async function backoff(attempt: number): Promise<void> {
  const delay = PROXY_RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
  await new Promise((r) => setTimeout(r, delay));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const url = `${BACKEND_URL}/api/v1/${path}`;
  
  try {
    if (DEBUG_PROXY) console.warn(`[PROXY] GET ${url}`);
    // Attach Authorization from cookie if not explicitly provided
    const authorization = request.headers.get('authorization') ||
      (request.cookies.get('access_token')?.value ? `Bearer ${request.cookies.get('access_token')!.value}` : undefined);
    const cookie = request.headers.get('cookie') || undefined;

    const proxyHeaders: HeadersInit = {};
    if (authorization) (proxyHeaders as Record<string, string>)['Authorization'] = authorization;
    if (cookie) (proxyHeaders as Record<string, string>)['Cookie'] = cookie;

    let attempt = 0;
    let response: Response | null = null;
    while (attempt <= PROXY_MAX_RETRIES) {
      const { signal, timeoutId } = withTimeout(request.signal);
      try {
        response = await fetch(url, { method: 'GET', headers: proxyHeaders, signal, cache: 'no-store' });
        clearTimeout(timeoutId);
        if (!shouldRetry(response.status)) break;
      } catch (err) {
        clearTimeout(timeoutId);
        if (attempt >= PROXY_MAX_RETRIES) throw err;
      }
      await backoff(attempt++);
    }
    // If we got a 401 once although we have cookie/authorization, retry once fresh (guards transient race around cookie write)
    if (response && response.status === 401 && attempt === 0) {
      const { signal, timeoutId } = withTimeout(request.signal);
      response = await fetch(url, { method: 'GET', headers: proxyHeaders, signal, cache: 'no-store' });
      clearTimeout(timeoutId);
    }
    if (!response) throw new Error('No response from backend');
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
    if (DEBUG_PROXY) console.warn(`[PROXY] POST ${url}`);
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
    const { signal, timeoutId } = withTimeout(request.signal);
    // Optimize for common types to avoid streaming issues
    if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
      const textBody = await request.text();
      const contentLength = new TextEncoder().encode(textBody).length.toString();
      (proxyHeaders as Record<string, string>)['Content-Length'] = contentLength;
      response = await fetch(url, { method: 'POST', headers: proxyHeaders, body: textBody, signal, cache: 'no-store' });
    } else if (contentType && contentType.includes('application/json')) {
      const jsonText = await request.text();
      response = await fetch(url, { method: 'POST', headers: proxyHeaders, body: jsonText, signal, cache: 'no-store' });
    } else {
      response = await fetch(url, {
        method: 'POST',
        headers: proxyHeaders,
        // Required by Node/Undici when sending a ReadableStream as body
        // @ts-expect-error Node/Undici requires duplex when streaming body in edge runtimes
        duplex: 'half',
        body: request.body,
        signal,
        cache: 'no-store',
      });
    }
    clearTimeout(timeoutId);
    
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
    if (DEBUG_PROXY) console.warn(`[PROXY] PUT ${url}`);
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
    const { signal, timeoutId } = withTimeout(request.signal);
    if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
      const textBody = await request.text();
      const contentLength = new TextEncoder().encode(textBody).length.toString();
      (proxyHeaders as Record<string, string>)['Content-Length'] = contentLength;
      response = await fetch(url, { method: 'PUT', headers: proxyHeaders, body: textBody, signal, cache: 'no-store' });
    } else if (contentType && contentType.includes('application/json')) {
      const jsonText = await request.text();
      response = await fetch(url, { method: 'PUT', headers: proxyHeaders, body: jsonText, signal, cache: 'no-store' });
    } else {
      response = await fetch(url, {
        method: 'PUT',
        headers: proxyHeaders,
        // @ts-expect-error Node/Undici requires duplex when streaming body in edge runtimes
        duplex: 'half',
        body: request.body,
        signal,
        cache: 'no-store',
      });
    }
    clearTimeout(timeoutId);
    
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
    if (DEBUG_PROXY) console.warn(`[PROXY] DELETE ${url}`);
    const authorization = request.headers.get('authorization') || undefined;
    const cookie = request.headers.get('cookie') || undefined;

    const proxyHeaders: HeadersInit = {};
    if (authorization) (proxyHeaders as Record<string, string>)['Authorization'] = authorization;
    if (cookie) (proxyHeaders as Record<string, string>)['Cookie'] = cookie;

    const { signal, timeoutId } = withTimeout(request.signal);
    const response = await fetch(url, { method: 'DELETE', headers: proxyHeaders, signal, cache: 'no-store' });
    clearTimeout(timeoutId);
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