from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Paper
from .serializers import PaperSerializer

class PaperDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            paper = Paper.objects.get(id=pk)
        except Paper.DoesNotExist:
            return Response(
                {'error': 'Paper not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = PaperSerializer(paper)
        return Response(serializer.data)
