from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from ..models import Session
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
        session = Session.objects.create(
            user=request.user,
            title=request.data.get('title', '')
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
