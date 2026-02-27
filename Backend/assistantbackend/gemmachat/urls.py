from django.urls import path

from . import views

urlpatterns = [
    path("api/health/", views.health, name="health"),
    path("api/chat/", views.chat, name="chat"),
]
