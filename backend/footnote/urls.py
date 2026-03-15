from django.urls import path
from .api.speechmatics import TemporaryKeyView
from .api.saved_papers import SavedPaperDetailView, SavedPaperListView
from .api.papers import PaperDetailView
from .api.sessions import SessionDetailView, SessionListView

urlpatterns = [
    path('token/', TemporaryKeyView.as_view()),
    
    path('saved-papers/', SavedPaperListView.as_view(), name='saved-papers'),
    path('saved-papers/<int:pk>/', SavedPaperDetailView.as_view(), name='saved-paper-detail'),

    path('papers/<int:pk>/', PaperDetailView.as_view(), name='paper-detail'),

    path('sessions/', SessionListView.as_view(), name='sessions'),
    path('sessions/<int:pk>/', SessionDetailView.as_view(), name='session-detail'),

]
