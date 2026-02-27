from django.urls import path

from .views import HealthView, ChatView

urlpatterns = [
    path("health/", HealthView.as_view()),
    path("chat/", ChatView.as_view()),
]
