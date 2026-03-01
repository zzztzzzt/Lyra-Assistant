from django.urls import path

from .views import HealthView, ChatView

app_name = "gemmachat"
urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("chat/", ChatView.as_view(), name="chat"),
]
