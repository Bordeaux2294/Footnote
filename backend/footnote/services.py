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
