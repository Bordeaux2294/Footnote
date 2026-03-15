/**
 * Splits incoming text into individual sentences using full stops as boundaries,
 * then checks each sentence for claims.
 *
 * Request:  { sentenceId, speakerId, text, timestamp }
 * Response: {
 *   sentenceId,
 *   claim: boolean,           // true if ANY sentence part is a claim
 *   claimData?: { summary, url, savedPaper },  // data from the first detected claim
 *   parts: Array<{ text, claim, claimData? }>  // per-sentence breakdown
 * }
 */
import { NextRequest, NextResponse } from "next/server";

const CLAIM_RULES = [
  {
    pattern: /\d+%/,
    savedPaper: "Statistical Analysis Quarterly, Vol. 12 (2024)",
    url: "https://doi.org/10.1000/example.stats",
    summary:
      "Percentage-based claims are verifiable against primary datasets. The figure cited aligns with benchmarks reported in multiple peer-reviewed studies.",
  },
  {
    pattern: /grew|growth|increased|decreased|declined|rose|fell/i,
    savedPaper: "Journal of Economic Research, 2024",
    url: "https://doi.org/10.1000/example.econ",
    summary:
      "Growth and change assertions of this type are trackable via official statistical releases. The direction of change is consistent with recent macroeconomic reporting.",
  },
  {
    pattern: /\balways\b|\bnever\b|\bevery\b|\ball\b/i,
    savedPaper: "Cognitive Bias in Language Studies (2023)",
    url: "https://doi.org/10.1000/example.cog",
    summary:
      "Absolute quantifiers (always, never, every) represent strong universal claims. Research suggests such language frequently overstates certainty and warrants verification.",
  },
  {
    pattern: /research shows|studies show|according to|data suggests|evidence shows/i,
    savedPaper: "Evidence-Based Methodology Review, 2024",
    url: "https://doi.org/10.1000/example.ebm",
    summary:
      "Citation-based language implies an external source. The referenced findings may derive from a subset of studies rather than a broad scientific consensus.",
  },
  {
    pattern: /billion|million|trillion/i,
    savedPaper: "Global Market Intelligence Report, 2025",
    url: "https://doi.org/10.1000/example.market",
    summary:
      "Large numerical claims are verifiable through public financial disclosures. Market sizing figures vary depending on scope definitions used.",
  },
  {
    pattern: /fastest|largest|biggest|most\b|highest|lowest|best|worst/i,
    savedPaper: "Comparative Industry Analysis (2024)",
    url: "https://doi.org/10.1000/example.comparative",
    summary:
      "Superlative claims require benchmark comparisons. Rankings vary significantly depending on the methodology and time period selected.",
  },
];

// Split text into sentences using full stops as the boundary.
// Splits on a period followed by whitespace to avoid breaking abbreviations mid-token.
function splitIntoSentences(text: string): string[] {
  const parts = text
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  console.log("[splitIntoSentences] Input text:", text);
  console.table(parts.map((part, i) => ({ index: i, sentence: part })));
  return parts;
}


function checkForClaim(text: string): { claim: boolean; claimData?: { summary: string; url: string; savedPaper: string } } {
  console.log("Checking sentence for claim:", text);
  for (const rule of CLAIM_RULES) {
    if (rule.pattern.test(text)) {
      return {
        claim: true,
        claimData: { summary: rule.summary, url: rule.url, savedPaper: rule.savedPaper },
      };
    }
  }
  return { claim: false };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sentenceId, speakerId, text, timestamp } = body;

  if (!sentenceId || !text) {
    return NextResponse.json({ error: "Missing sentenceId or text" }, { status: 400 });
  }

  const sentenceParts = splitIntoSentences(text);

  const parts = sentenceParts.map((part) => {
    const result = checkForClaim(part);
    return { text: part, ...result };
  });

  // The overall row is a claim if any individual sentence is a claim
  const firstClaim = parts.find((p) => p.claim);
  const overallClaim = !!firstClaim;
  const claimData = firstClaim?.claimData;

  return NextResponse.json({
    sentenceId,
    claim: overallClaim,
    ...(claimData ? { claimData } : {}),
    parts,
  });
}
