/**
 * Proxies sentence claim-checking to the Django backend.
 *
 * Calls POST /api/footnote/check-sentence/ synchronously.
 * Returns whether the sentence is a claim, and if so, the verdict + sources.
 *
 * Request:  { sentenceId, speakerId, text }
 * Response: { sentenceId, is_claim, verdict?, confidence?, summary?, sources? }
 */
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sentenceId, text } = body;

  if (!sentenceId || !text) {
    return NextResponse.json(
      { error: "Missing sentenceId or text" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${BACKEND}/api/footnote/check-sentence/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentenceId, text }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { sentenceId, is_claim: false },
        { status: 200 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ sentenceId, is_claim: false });
  }
}
