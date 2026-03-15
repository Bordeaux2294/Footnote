from allauth.socialaccount.models import SocialAccount
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
import logging
from django.conf import settings
from django.contrib.auth import get_user_model, logout as auth_logout
from django.shortcuts import redirect
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

logger = logging.getLogger(__name__)
User = get_user_model()

class GoogleLoginView(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:3000"
    client_class = OAuth2Client

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        social = SocialAccount.objects.filter(user=user).first()
        auth_logout(request)
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        if social and social.provider == 'google':
            return redirect(f"{frontend_url}?clearSession=true&provider=google")
        return redirect(f"{frontend_url}?clearSession=true")

class UserInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": getattr(user, "first_name", ""),
            "last_name": getattr(user, "last_name", ""),
            "social_profiles": {}
        }
        social_accounts = SocialAccount.objects.filter(user=user)
        for social in social_accounts:
            data["social_profiles"][social.provider] = {
                "picture": social.extra_data.get("picture"),
                "locale": social.extra_data.get("locale"),
            }
        return Response(data)
