/**
 * Proxies session operations to the Django backend.
 *
 * POST → POST /api/footnote/sessions/  (create session with sentences + claims)
 */
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = req.headers.get("authorization") || "";
  const { title, sentences } = body;

  if (!sentences || !Array.isArray(sentences)) {
    return NextResponse.json(
      { error: "Invalid session data — expected sentences array" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${BACKEND}/api/footnote/sessions/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ title, sentences }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || "Failed to create session" },
        { status: res.status }
      );
    }

    const session = await res.json();

    return NextResponse.json({
      sessionId: session.id,
      message: "Session saved successfully",
      session,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 502 }
    );
  }
}
