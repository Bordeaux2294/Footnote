import { NextResponse } from "next/server";
import { createSpeechmaticsJWT } from "@speechmatics/auth";

export async function GET() {
  const apiKey = process.env.SPEECHMATICS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "SPEECHMATICS_API_KEY not configured" }, { status: 500 });
  }
  try {
    const jwt = await createSpeechmaticsJWT({ type: "rt", apiKey, ttl: 3600 });
    return NextResponse.json({ jwt });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
