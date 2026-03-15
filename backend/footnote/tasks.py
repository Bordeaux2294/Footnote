from celery import shared_task
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Sentence, Claim, ClaimSource
from .services import detect_claim, get_embedding, search_similar_chunks, generate_verdict

channel_layer = get_channel_layer()


@shared_task
def extract_claim(sentence_id: int):
    try:
        sentence = Sentence.objects.select_related('session').get(id=sentence_id)
    except Sentence.DoesNotExist:
        return

    result = detect_claim(sentence.content)

    if not result.get('is_claim') or result.get('confidence', 0) <= 0.7:
        return

    sentence.is_claim = True
    sentence.save()

    claim = Claim.objects.create(
        session=sentence.session,
        sentence=sentence,
        verdict=Claim.Verdict.PENDING
    )

    # notify frontend that a claim was detected
    async_to_sync(channel_layer.group_send)(
        f"session_{sentence.session.id}",
        {
            "type": "send_update",
            "data": {
                "type": "claim_detected",
                "sentence_id": sentence.id,
                "claim_id": claim.id,
                "sentence_order": sentence.order
            }
        }
    )

    # fire verification
    verify_claim.delay(claim.id)


@shared_task
def verify_claim(claim_id: int):
    try:
        claim = Claim.objects.select_related(
            'sentence', 'session'
        ).get(id=claim_id)
    except Claim.DoesNotExist:
        return

    # embed the claim
    embedding = get_embedding(claim.sentence.content)

    # search for similar chunks
    retrieved = search_similar_chunks(embedding, top_k=5)

    if not retrieved:
        claim.verdict = Claim.Verdict.INCONCLUSIVE
        claim.confidence_score = 0.0
        claim.summary = "No relevant literature found."
        claim.save()
    else:
        # generate verdict
        verdict_data = generate_verdict(claim.sentence.content, retrieved)

        claim.verdict = verdict_data.get('verdict', Claim.Verdict.INCONCLUSIVE)
        claim.confidence_score = verdict_data.get('confidence_score', 0.0)
        claim.summary = verdict_data.get('summary', '')
        claim.save()

        # create ClaimSource records
        #source_verdicts = {s['index']: s['supports'] for s in verdict_data.get('sources', [])}

        for i, item in enumerate(retrieved):
            ClaimSource.objects.create(
                claim=claim,
                paper=item['chunk'].paper,
                similarity_score=item['similarity'],
                excerpt=item['chunk'].content,
                supports= verdict_data.get('sources', [])#source_verdicts.get(i, True)
            )

    # notify frontend verdict is ready
    async_to_sync(channel_layer.group_send)(
        f"session_{claim.session.id}",
        {
            "type": "send_update",
            "data": {
                "type": "claim_verified",
                "claim_id": claim.id,
                "sentence_id": claim.sentence.id,
                "verdict": claim.verdict,
                "confidence_score": claim.confidence_score,
                "summary": claim.summary,
                "sources": [
                    {
                        "paper_id": cs.paper.id,
                        "title": cs.paper.title,
                        "authors": cs.paper.authors,
                        "year": cs.paper.year,
                        "excerpt": cs.excerpt,
                        "similarity_score": cs.similarity_score,
                        "supports": cs.supports
                    }
                    for cs in claim.sources.select_related('paper').all()
                ]
            }
        }
    )
