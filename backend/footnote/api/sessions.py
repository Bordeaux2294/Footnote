from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from ..models import Session, Sentence, Claim, Paper, ClaimSource
from ..serializers import SessionSerializer, SessionListSerializer


class SessionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = Session.objects.filter(
            user=request.user
        ).order_by('-started_at')
        serializer = SessionListSerializer(sessions, many=True)
        return Response(serializer.data)

    def post(self, request):
        title = request.data.get('title', '')
        sentences_data = request.data.get('sentences', [])

        session = Session.objects.create(
            user=request.user,
            title=title,
            is_active=False,
        )

        for i, s in enumerate(sentences_data):
            sentence = Sentence.objects.create(
                session=session,
                speaker_id=s.get('speakerId', s.get('speaker_id', '')),
                content=s.get('text', s.get('content', '')),
                is_claim=bool(s.get('isClaim', s.get('is_claim', False))),
                order=i,
            )

            claim_data = s.get('claimData')
            if sentence.is_claim and claim_data:
                claim = Claim.objects.create(
                    session=session,
                    sentence=sentence,
                    verdict=claim_data.get('verdict', 'supported'),
                    confidence_score=claim_data.get('confidence', 0.0),
                    summary=claim_data.get('summary', ''),
                )

                for src in claim_data.get('sources', []):
                    paper, _ = Paper.objects.get_or_create(
                        title=src.get('title', 'Unknown'),
                        defaults={
                            'authors': src.get('authors', []),
                            'year': src.get('year'),
                            'abstract': src.get('excerpt', ''),
                            'source_url': src.get('url', ''),
                        }
                    )
                    ClaimSource.objects.create(
                        claim=claim,
                        paper=paper,
                        similarity_score=src.get('similarity_score', 0.0),
                        excerpt=src.get('excerpt', ''),
                        supports=src.get('supports', True),
                    )

        serializer = SessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            session = Session.objects.prefetch_related(
                'sentences__claim__sources__paper'
            ).get(id=pk, user=request.user)
        except Session.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SessionSerializer(session)
        return Response(serializer.data)

    def patch(self, request, pk):
        try:
            session = Session.objects.get(id=pk, user=request.user)
        except Session.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        session.title = request.data.get('title', session.title)
        session.is_active = request.data.get('is_active', session.is_active)
        session.save()
        serializer = SessionSerializer(session)
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            session = Session.objects.get(id=pk, user=request.user)
        except Session.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
