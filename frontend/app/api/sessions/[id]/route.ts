/**
 * Proxies individual session retrieval to the Django backend.
 *
 * GET /api/sessions/:id → GET /api/footnote/sessions/:id/
 */
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.headers.get("authorization") || "";

  try {
    const res = await fetch(`${BACKEND}/api/footnote/sessions/${id}/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: res.status }
      );
    }

    const session = await res.json();
    return NextResponse.json({ session });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 502 }
    );
  }
}
