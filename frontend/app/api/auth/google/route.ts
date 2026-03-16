/**
 * Proxies Google OAuth login to the Django backend.
 *
 * POST /api/auth/google/ → POST {BACKEND}/api/auth/google/
 */
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const res = await fetch(`${BACKEND}/api/auth/google/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to connect to backend" }, { status: 502 });
  }
}
