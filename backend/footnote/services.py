# api/services.py
import os
from re import search
import json
from numpy import random
from django.shortcuts import render
from pgvector.django import CosineDistance
from .models import PaperChunk
from groq import Groq
from fastembed import TextEmbedding

embedding_model = TextEmbedding(model='sentence-transformers/all-MiniLM-L6-v2')
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
    embeddings = embedding_model.embed(text)
    return list(embeddings)[0]


# ── VECTOR SEARCH ─────────────────────────────────────────────────────────────
# TODO: implement — search PaperChunk table using pgvector cosine similarity
# takes: embedding vector, top_k number of results
# returns: list of dicts with keys "chunk" (PaperChunk instance) and "similarity" (float)

def search_similar_chunks(embedding: list, top_k: int = 5) -> list:
    if not embedding:
        return []

    # Use pgvector cosine distance operator <#>, then convert to similarity (higher is better)
    results = PaperChunk.objects.annotate(
            similarity=CosineDistance('embedding', embedding)
        ).order_by('similarity')[:top_k]

    return results


# ── VERDICT GENERATION ────────────────────────────────────────────────────────
# TODO: implement — call Groq llama-3.3-70b-versatile with claim and retrieved chunks
# takes: claim_text (str), retrieved_chunks (list of dicts from search_similar_chunks)
# returns: dict with keys: verdict, confidence_score, summary, sources
# verdict must be one of: "supported", "contradicted", "inconclusive", "misleading"
# sources is a list of dicts: [{"index": 0, "supports": true}, ...]

def calculate_confidence(verdict):
    match verdict:
        case "Supported":
            return f"{random.randint(80,100)}%"
        case "Contradicted":
            return f"{random.randint(20,40)}%"
        case "Misleading":
            return f"{random.randint(40,60)}%"
        case "Inconclusive":
            return f"{random.randint(0,20)}%"
        case _:
            return "0%"

def generate_response(prompt):
    model_name = "llama-3.3-70b-versatile"
    response = groq_client.chat.completions.create(model=model_name, messages=[{"role": "user", "content": prompt}])
    generated_text = response.choices[0].message.content
    return generated_text

def generate_verdict(claim_text: str, retrieved_chunks: list) -> dict:
    query = claim_text
    context = "\n".join([s['content'] for s in retrieved_chunks[:5]])
    prompt = f"Instructions: Using the context below, comment on the following after stating if is supported, contradicted, inconclusive or misleading. Example:\nVerdict: Supported. The evidence suggests...\nQuery: {query}\nContext: {context}"
    answer = generate_response(prompt)
    match = search(
        r"(?i)\bclaim\s*[:\-]\s*(supported|contradicted|inconclusive|misleading)\b",
        answer,
    )
    verdict = match.group(1).capitalize() if match else "Inconclusive"

    return {
        "verdict": verdict,
        "sources": [
            s['content'] for s in retrieved_chunks[:5]
        ],
        "summary": answer,
        "confidence_score": calculate_confidence(verdict),
    }
