import os
import uuid
import ollama
from django.db.models import Max

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import ChatMessage
from .serializers import ChatSerializer


def get_ollama_client() -> ollama.Client:
    host = os.getenv("OLLAMA_HOST")
    return ollama.Client(host=host)


def get_recent_history(conversation_id: str, limit: int) -> list[dict]:
    history = (
        ChatMessage.objects.filter(conversation_id=conversation_id)
        .order_by("-created_at", "-id")[:limit]
    )
    return [
        {"role": item.role, "content": item.content}
        for item in reversed(list(history))
    ]


def prune_conversation(conversation_id: str, keep_limit: int) -> None:
    old_ids = list(
        ChatMessage.objects.filter(conversation_id=conversation_id)
        .order_by("-created_at", "-id")
        .values_list("id", flat=True)[keep_limit:]
    )
    if old_ids:
        ChatMessage.objects.filter(id__in=old_ids).delete()


class HealthView(APIView):
    def get(self, request):
        return Response(
            {
                "status": "ok",
                "service": "gemmachat",
                "default_model": os.getenv("OLLAMA_MODEL"),
            }
        )


class ChatView(APIView):
    def post(self, request):
        serializer = ChatSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data["message"]
        conversation_id = (
            serializer.validated_data.get("conversation_id")
            or str(uuid.uuid4())
        )
        model = (
            serializer.validated_data.get("model")
            or os.getenv("OLLAMA_MODEL")
        )
        history_limit = int(os.getenv("CHAT_HISTORY_LIMIT", "12"))
        storage_limit = int(os.getenv("CHAT_STORAGE_LIMIT", "40"))

        if not model:
            return Response(
                {"error": "Model is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        history = get_recent_history(
            conversation_id=conversation_id,
            limit=max(history_limit, 0),
        )
        messages = history + [{"role": "user", "content": message}]

        try:
            response = get_ollama_client().chat(
                model=model,
                messages=messages,
                # Wait a maximum of 30 seconds
                options={"timeout": 30},
            )
        except Exception:
            return Response(
                {
                    "error": "Failed to call Ollama.",
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        reply = response.get("message", {}).get("content", "")
        ChatMessage.objects.bulk_create(
            [
                ChatMessage(
                    conversation_id=conversation_id,
                    role=ChatMessage.ROLE_USER,
                    content=message,
                ),
                ChatMessage(
                    conversation_id=conversation_id,
                    role=ChatMessage.ROLE_ASSISTANT,
                    content=reply,
                ),
            ]
        )
        prune_conversation(
            conversation_id=conversation_id,
            keep_limit=max(storage_limit, 0),
        )

        return Response(
            {
                "model": model,
                "conversation_id": conversation_id,
                "message": message,
                "reply": reply,
            }
        )


class ConversationListView(APIView):
    def get(self, request):
        latest_by_conversation = (
            ChatMessage.objects.values("conversation_id")
            .annotate(latest_created_at=Max("created_at"))
            .order_by("-latest_created_at")
        )

        summaries = []
        for item in latest_by_conversation:
            conversation_id = item["conversation_id"]
            latest_message = (
                ChatMessage.objects.filter(conversation_id=conversation_id)
                .order_by("-created_at", "-id")
                .first()
            )
            first_user_message = (
                ChatMessage.objects.filter(
                    conversation_id=conversation_id,
                    role=ChatMessage.ROLE_USER,
                )
                .order_by("created_at", "id")
                .first()
            )
            count = ChatMessage.objects.filter(
                conversation_id=conversation_id
            ).count()

            summaries.append(
                {
                    "conversation_id": conversation_id,
                    "title": (
                        first_user_message.content[:64]
                        if first_user_message
                        else "Untitled chat"
                    ),
                    "preview": (
                        latest_message.content[:80]
                        if latest_message
                        else ""
                    ),
                    "message_count": count,
                    "updated_at": (
                        latest_message.created_at.isoformat()
                        if latest_message
                        else None
                    ),
                }
            )

        return Response({"conversations": summaries})


class ConversationDetailView(APIView):
    def get(self, request, conversation_id: str):
        history = ChatMessage.objects.filter(
            conversation_id=conversation_id
        ).order_by("created_at", "id")

        if not history.exists():
            return Response(
                {"error": "Conversation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "conversation_id": conversation_id,
                "messages": [
                    {
                        "id": str(item.id),
                        "role": item.role,
                        "content": item.content,
                        "created_at": item.created_at.isoformat(),
                    }
                    for item in history
                ],
            }
        )
