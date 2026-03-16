# api/services.py
import os
import json
from groq import Groq

groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


# ── CLAIM DETECTION ───────────────────────────────────────────────────────────
# implemented — do not touch

def detect_claim(sentence_text: str) -> dict:
    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": """You are a claim detection classifier. Determine whether a sentence contains a falsifiable factual claim that could be verified against academic literature.

A claim IS verifiable if it:
- States a fact that could be true or false
- References research, studies, statistics or scientific findings
- Makes a causal or correlational assertion

A claim IS NOT verifiable if it:
- Is an opinion or preference
- Is a question
- Is a greeting or filler speech
- Is too vague to verify
- Is about a personal experience

Respond ONLY with valid JSON, no other text:
{"is_claim": true, "confidence": 0.95}
or
{"is_claim": false, "confidence": 0.95}"""
            },
            {
                "role": "user",
                "content": sentence_text
            }
        ],
        temperature=0.1,
        max_tokens=50
    )

    raw = response.choices[0].message.content.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"is_claim": False, "confidence": 0.0}


# ── EMBEDDING ─────────────────────────────────────────────────────────────────
# TODO: implement — call HF or Cohere API to embed text
# returns: list of floats representing the embedding vector

def get_embedding(text: str) -> list:
    raise NotImplementedError("get_embedding not yet implemented")


# ── VECTOR SEARCH ─────────────────────────────────────────────────────────────
# TODO: implement — search PaperChunk table using pgvector cosine similarity
# takes: embedding vector, top_k number of results
# returns: list of dicts with keys "chunk" (PaperChunk instance) and "similarity" (float)

def search_similar_chunks(embedding: list, top_k: int = 5) -> list:
    raise NotImplementedError("search_similar_chunks not yet implemented")


# ── VERDICT GENERATION ────────────────────────────────────────────────────────
# TODO: implement — call Groq llama-3.3-70b-versatile with claim and retrieved chunks
# takes: claim_text (str), retrieved_chunks (list of dicts from search_similar_chunks)
# returns: dict with keys: verdict, confidence_score, summary, sources
# verdict must be one of: "supported", "contradicted", "inconclusive", "misleading"
# sources is a list of dicts: [{"index": 0, "supports": true}, ...]

def generate_verdict(claim_text: str, retrieved_chunks: list) -> dict:
    raise NotImplementedError("generate_verdict not yet implemented")


# ── SIMPLE VERDICT (no pgvector / embeddings needed) ─────────────────────────
# Works with a list of paper dicts containing title, authors, year, url, abstract.
# Uses Groq to determine if the claim is supported by the provided papers.

def generate_verdict_simple(claim_text: str, papers: list) -> dict:
    papers_context = "\n\n".join(
        f"[Paper {i+1}] {p['title']} ({p['year']})\n"
        f"Authors: {', '.join(p['authors']) if isinstance(p['authors'], list) else p['authors']}\n"
        f"Abstract: {p['abstract']}"
        for i, p in enumerate(papers)
    )

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": """You are an academic fact-checker. Given a claim and a set of peer-reviewed papers, determine whether the claim is supported, contradicted, inconclusive, or misleading based on the evidence in those papers.

Respond ONLY with valid JSON in this exact format:
{
  "verdict": "supported",
  "confidence_score": 0.92,
  "summary": "Brief 1-2 sentence explanation of the verdict.",
  "sources": [
    {"index": 0, "title": "Paper title", "authors": ["Author"], "year": 2021, "url": "https://...", "supports": true, "excerpt": "Relevant quote or paraphrase from the paper."}
  ]
}

Rules:
- verdict must be one of: "supported", "contradicted", "inconclusive", "misleading"
- Only include papers that are actually relevant to the claim in sources (at least 1, up to 3)
- confidence_score is 0.0 to 1.0
- excerpt should be a short relevant passage from the paper abstract
- supports is true if the paper supports the claim, false if it contradicts"""
            },
            {
                "role": "user",
                "content": f"CLAIM: {claim_text}\n\nAVAILABLE PAPERS:\n{papers_context}"
            }
        ],
        temperature=0.1,
        max_tokens=800,
    )

    raw = response.choices[0].message.content.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Try to extract JSON from markdown code blocks
        import re
        match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        return {
            "verdict": "inconclusive",
            "confidence_score": 0.0,
            "summary": "Could not process verdict.",
            "sources": [],
        }
