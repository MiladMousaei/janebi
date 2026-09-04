import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, { params }: Context) {
  const { path } = await params;
  const publicApi = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const base = process.env.INTERNAL_API_URL?.replace(/\/$/, "")
    || publicApi
    || (process.env.INTERNAL_API_HOSTPORT ? `http://${process.env.INTERNAL_API_HOSTPORT}/api/v1` : "http://127.0.0.1:8000/api/v1");
  const headers = new Headers();
  for (const key of ["authorization", "content-type", "accept"]) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();
  const attempts = ["GET", "HEAD"].includes(request.method) ? 2 : 1;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${base}/${path.join("/")}/${request.nextUrl.search}`, {
        method: request.method, headers, body, redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(75_000),
      });
      if (response.status >= 500 && attempt + 1 < attempts) { await new Promise(resolve => setTimeout(resolve, 900)); continue; }
      const outputHeaders = new Headers();
      for (const key of ["content-type", "content-disposition", "location"]) {
        const value = response.headers.get(key);
        if (value) outputHeaders.set(key, value);
      }
      outputHeaders.set("Cache-Control", "no-store");
      return new Response(response.body, { status: response.status, headers: outputHeaders });
    } catch {
      if (attempt + 1 < attempts) { await new Promise(resolve => setTimeout(resolve, 900)); continue; }
    }
  }
  return Response.json({ detail: "سرویس فروشگاه در حال آماده‌شدن است؛ چند لحظه دیگر دوباره تلاش کنید." }, { status: 503, headers: { "Retry-After": "3" } });
}

export const GET = proxy; export const POST = proxy; export const PUT = proxy;
export const PATCH = proxy; export const DELETE = proxy; export const OPTIONS = proxy;
