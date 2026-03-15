from django.urls import path
from .api.auth import GoogleLoginView, LogoutView, UserInfoView

urlpatterns = [
    path('google/', GoogleLoginView.as_view(), name='google_login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('user/', UserInfoView.as_view(), name='user_info'),
]
