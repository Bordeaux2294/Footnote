/**
 * Mock backend — persists a completed session.
 * In production this will write to a real database.
 *
 * Request:
 *   {
 *     sentences: Array<{
 *       sentenceId: string,
 *       speakerId: string,
 *       text: string,
 *       timestamp: string,
 *       claim: boolean,
 *       claimData?: { summary: string, url: string, savedPaper: string }
 *     }>,
 *     createdAt: string  // ISO timestamp
 *   }
 *
 * Response: { sessionId, message, summary: { sentenceCount, claimCount, createdAt } }
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sentences, createdAt } = body;

  if (!sentences || !Array.isArray(sentences)) {
    return NextResponse.json({ error: "Invalid session data — expected sentences array" }, { status: 400 });
  }

  // Validate each sentence has the required fields
  for (const s of sentences) {
    if (!s.sentenceId || !s.speakerId || typeof s.text !== "string") {
      return NextResponse.json(
        { error: `Malformed sentence object: ${JSON.stringify(s)}` },
        { status: 400 }
      );
    }
  }

  const sessionId = `session_${Date.now()}`;
  const claims = sentences.filter((s: any) => s.claim === true);
  const claimHistory = claims.map((c: any) => ({
    sentenceId: c.sentenceId,
    text: c.text,
    speakerId: c.speakerId,
    timestamp: c.timestamp,
    claimData: c.claimData ?? null,
  }));

  return NextResponse.json({
    sessionId,
    message: "Session saved successfully",
    summary: {
      sentenceCount: sentences.length,
      claimCount: claims.length,
      createdAt: createdAt ?? new Date().toISOString(),
    },
    // Echo back structured claim history so the frontend can optionally use it
    claimHistory,
  });
}
