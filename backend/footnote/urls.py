from django.urls import path
from .api.speechmatics import TemporaryKeyView

urlpatterns = [
    path('token/', TemporaryKeyView.as_view()),
]
