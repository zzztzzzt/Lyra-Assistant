from django.urls import path

from .views import (
    HealthView,
    ChatView,
    ConversationListView,
    ConversationDetailView,
)

app_name = "llmchat"
urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("chat/", ChatView.as_view(), name="chat"),
    path("conversations/", ConversationListView.as_view(), name="conversations"),
    path(
        "conversations/<str:conversation_id>/",
        ConversationDetailView.as_view(),
        name="conversation-detail",
    ),
]
