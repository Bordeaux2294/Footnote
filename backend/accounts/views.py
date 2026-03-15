import os

from django.contrib.auth.models import User
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

GOOGLE_CLIENT_ID = os.environ.get("Google_Client_ID", "")


@api_view(["POST"])
@permission_classes([AllowAny])
def google_login(request):
    """
    Accepts a Google ID token (credential) from the frontend,
    verifies it, creates or retrieves the user, and returns a JWT pair.
    """
    credential = request.data.get("credential")
    if not credential:
        return Response(
            {"error": "Missing credential"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        idinfo = id_token.verify_oauth2_token(
            credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except ValueError:
        return Response(
            {"error": "Invalid Google token"}, status=status.HTTP_401_UNAUTHORIZED
        )

    email = idinfo.get("email")
    first_name = idinfo.get("given_name", "")
    last_name = idinfo.get("family_name", "")
    picture = idinfo.get("picture", "")

    user, created = User.objects.get_or_create(
        username=email,
        defaults={
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
        },
    )

    if not created:
        user.first_name = first_name
        user.last_name = last_name
        user.save(update_fields=["first_name", "last_name"])

    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "picture": picture,
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """Return the current authenticated user's info."""
    user = request.user
    return Response(
        {
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }
    )
