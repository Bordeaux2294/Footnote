/**
 * Mock backend — checks whether a sentence is a claim.
 * In production this will be replaced by a real AI/NLP service.
 *
 * Request:  { sentenceId, speakerId, text, timestamp }
 * Response: { sentenceId, claim: boolean, claimData?: { summary, url, savedPaper } }
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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sentenceId, speakerId, text, timestamp } = body;

  if (!sentenceId || !text) {
    return NextResponse.json({ error: "Missing sentenceId or text" }, { status: 400 });
  }

  for (const rule of CLAIM_RULES) {
    if (rule.pattern.test(text)) {
      return NextResponse.json({
        sentenceId,
        claim: true,
        claimData: {
          summary: rule.summary,
          url: rule.url,
          savedPaper: rule.savedPaper,
        },
      });
    }
  }

  return NextResponse.json({ sentenceId, claim: false });
}
