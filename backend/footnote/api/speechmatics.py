import requests
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

SPEECHMATICS_API_KEY = os.environ.get('SPEECHMATICS_API_KEY')

class TemporaryKeyView(APIView):
    def post(self, request):
        response = requests.post(
            'https://mp.speechmatics.com/v1/api_keys?type=rt',
            headers={
                'Authorization': f'Bearer {SPEECHMATICS_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={'ttl': 60}
        )

        if response.status_code != 201:
            return Response(
                {'error': 'Failed to generate temporary key'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        data = response.json()
        return Response({'key': data['key_value']})
