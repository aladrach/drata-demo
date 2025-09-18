import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSecretFromRequest(req: NextRequest): string | null {
  const urlSecret = req.nextUrl.searchParams.get("secret");
  const headerSecret = req.headers.get("x-revalidate-token");
  return urlSecret || headerSecret || null;
}

function normalizePaths(input: unknown): string[] {
  const result: string[] = [];
  if (typeof input === "string") result.push(input);
  else if (Array.isArray(input)) {
    for (const item of input) if (typeof item === "string") result.push(item);
  }
  return Array.from(new Set(result.map((p) => p.trim()))).filter((p) => p.startsWith("/"));
}

async function extractPaths(req: NextRequest): Promise<string[]> {
  // Prefer body on POST, fall back to query params
  if (req.method === "POST") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        const body: unknown = await req.json();
        let candidate: unknown = undefined;
        if (body && typeof body === "object") {
          if ("paths" in (body as Record<string, unknown>)) {
            candidate = (body as Record<string, unknown>).paths;
          } else if ("path" in (body as Record<string, unknown>)) {
            candidate = (body as Record<string, unknown>).path;
          }
        }
        const paths = normalizePaths(candidate);
        if (paths.length) return paths;
      } catch {
        // ignore JSON parse errors and fall back to query param
      }
    }
  }

  const qp = req.nextUrl.searchParams;
  const pathParam = qp.get("path");
  const pathsParam = qp.get("paths");
  let candidate: unknown = null;
  if (pathsParam) {
    try {
      candidate = JSON.parse(pathsParam);
    } catch {
      candidate = pathsParam;
    }
  } else if (pathParam) {
    candidate = pathParam;
  }
  return normalizePaths(candidate);
}

async function handle(req: NextRequest) {
  const requiredSecret = process.env.NEXT_REVALIDATE_SECRET || "";
  if (requiredSecret) {
    const provided = getSecretFromRequest(req);
    if (!provided || provided !== requiredSecret) {
      return NextResponse.json(
        { revalidated: false, error: "Invalid secret" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }
  }

  const paths = await extractPaths(req);
  if (!paths.length) {
    return NextResponse.json(
      { revalidated: false, error: "Provide a path or paths to revalidate" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const revalidated: string[] = [];
  const failed: string[] = [];
  for (const p of paths) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch {
      failed.push(p);
    }
  }

  const ok = failed.length === 0;
  return NextResponse.json(
    { revalidated: ok, paths: revalidated, failed, now: new Date().toISOString() },
    { status: ok ? 200 : 207, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}


