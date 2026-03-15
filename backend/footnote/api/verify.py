
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from celery.result import AsyncResult
from ..models import Claim, Session
from ..serializers import ClaimSerializer
from ..tasks import verify_claim


class VerifyClaimView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        claim_text = request.data.get('text')

        if not claim_text:
            return Response(
                {'error': 'text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # create a standalone claim not tied to a session
        # for text mode there is no session
        claim = Claim.objects.create(
            session=None,
            sentence=None,
            verdict=Claim.Verdict.PENDING
        )

        # store the raw text temporarily on the summary field
        # so the task knows what to verify
        claim.summary = claim_text
        claim.save()

        task = verify_claim.delay(claim.id)

        return Response(
            {'task_id': task.id, 'claim_id': claim.id},
            status=status.HTTP_202_ACCEPTED
        )


class VerifyStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        result = AsyncResult(task_id)

        if result.status == 'PENDING':
            return Response({'status': 'pending'})

        if result.status == 'FAILURE':
            return Response(
                {'status': 'failed', 'error': str(result.result)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if result.status == 'SUCCESS':
            try:
                claim = Claim.objects.prefetch_related(
                    'sources__paper'
                ).get(id=result.result)
                serializer = ClaimSerializer(claim)
                return Response({
                    'status': 'complete',
                    'claim': serializer.data
                })
            except Claim.DoesNotExist:
                return Response(
                    {'error': 'Claim not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        return Response({'status': result.status.lower()})
