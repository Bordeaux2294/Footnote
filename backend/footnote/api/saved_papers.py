from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import SavedPaper, Paper, Claim
from .serializers import SavedPaperSerializer


class SavedPaperListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        saved = SavedPaper.objects.filter(
            user=request.user
        ).select_related('paper', 'saved_from_claim').order_by('-saved_at')
        serializer = SavedPaperSerializer(saved, many=True)
        return Response(serializer.data)

    def post(self, request):
        paper_id = request.data.get('paper_id')
        claim_id = request.data.get('claim_id', None)

        if not paper_id:
            return Response(
                {'error': 'paper_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            paper = Paper.objects.get(id=paper_id)
        except Paper.DoesNotExist:
            return Response(
                {'error': 'Paper not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        claim = None
        if claim_id:
            try:
                claim = Claim.objects.get(id=claim_id)
            except Claim.DoesNotExist:
                pass

        saved_paper, created = SavedPaper.objects.get_or_create(
            user=request.user,
            paper=paper,
            defaults={'saved_from_claim': claim}
        )

        if not created:
            return Response(
                {'message': 'Paper already saved'},
                status=status.HTTP_200_OK
            )

        serializer = SavedPaperSerializer(saved_paper)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SavedPaperDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            saved = SavedPaper.objects.get(id=pk, user=request.user)
        except SavedPaper.DoesNotExist:
            return Response(
                {'error': 'Saved paper not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        saved.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
