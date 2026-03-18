import os
import uuid
import ollama
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from django.db.models import Max

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import ChatMessage
from .serializers import ChatSerializer

from .tools import pick_oklch_by_semantics, predict_color_palette


def get_ollama_client() -> ollama.Client:
    host = os.getenv("OLLAMA_HOST")
    return ollama.Client(host=host)


def get_recent_history(conversation_id: str, limit: int) -> list[dict]:
    history = (
        ChatMessage.objects.filter(
            conversation_id=conversation_id,
            is_system_call=False,
        )
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


def normalize_ai_content(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                text = item.get("text")
                if text:
                    parts.append(str(text))
            elif item:
                parts.append(str(item))
        return "".join(parts).strip()
    if content is None:
        return ""
    return str(content)


class HealthView(APIView):
    def get(self, request):
        return Response(
            {
                "status": "ok",
                "service": "llmchat",
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
        is_system_call = serializer.validated_data.get("is_system_call", False)
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

        llm = ChatOllama(
            model=model,
            base_url=os.getenv("OLLAMA_HOST"),
        )

        llm_invoker = (
            llm
            if is_system_call
            else llm.bind_tools([pick_oklch_by_semantics, predict_color_palette])
        )

        langchain_messages = [
            SystemMessage(
                content=(
                    "You (you are yourself not Lyra) are now working with Lyra (another AI Model), a professional color-harmony AI Model.\n"
                    "If the user asks for colors, color palettes, gradients, or Lyra color prediction, you MUST call tools in this exact order:\n"
                    "1) pick_oklch_by_semantics (pass only user_input)\n"
                    "2) predict_color_palette (use the L/C/H you got from step 1)\n"
                    "After you call pick_oklch_by_semantics, use those L/C/H value to call predict_color_palette. \n"
                    "(If the user's request is in other languages, translate the color word to a simple English color name, then call pick_oklch_by_semantics)\n"
                    "Otherwise just answer normally chat with user, don't reply colors to them.\n"
                    "When describing palettes (describe it only if user asks for colors, color palettes, gradients, or Lyra color prediction ), always list all HEX colors in order. "
                    "And at final, you need to also have some not related conversations with user.\n"
                    "Finally, when answering users, DON'T LET THEM KNOW that you've gone through the above considerations IF THEY DON'T ASK."
                )
            )
        ]

        for msg in history:
            if msg["role"] == "user":
                langchain_messages.append(HumanMessage(content=msg["content"]))
            else:
                langchain_messages.append(AIMessage(content=msg["content"]))

        langchain_messages.append(HumanMessage(content=message))

        ai_msg = llm_invoker.invoke(langchain_messages)

        if ai_msg.tool_calls:
            tools_by_name = {
                "pick_oklch_by_semantics": pick_oklch_by_semantics,
                "predict_color_palette": predict_color_palette,
            }

            langchain_messages.append(ai_msg)

            for tool_call in ai_msg.tool_calls:
                tool_impl = tools_by_name.get(tool_call.get("name"))
                if not tool_impl:
                    continue

                result = tool_impl.invoke(tool_call.get("args", {}))

                langchain_messages.append(
                    ToolMessage(
                        content=str(result),
                        tool_call_id=tool_call["id"],
                        name=tool_call["name"],
                    )
                )

            final = llm.invoke(langchain_messages)
            reply = normalize_ai_content(final.content)

        else:
            reply = normalize_ai_content(ai_msg.content)

        ChatMessage.objects.bulk_create(
            [
                ChatMessage(
                    conversation_id=conversation_id,
                    role=ChatMessage.ROLE_USER,
                    content=message,
                    is_system_call=is_system_call,
                ),
                ChatMessage(
                    conversation_id=conversation_id,
                    role=ChatMessage.ROLE_ASSISTANT,
                    content=reply,
                    is_system_call=is_system_call,
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
        visible_messages = ChatMessage.objects.filter(is_system_call=False)
        latest_by_conversation = (
            visible_messages.values("conversation_id")
            .annotate(latest_created_at=Max("created_at"))
            .order_by("-latest_created_at")
        )

        summaries = []
        for item in latest_by_conversation:
            conversation_id = item["conversation_id"]
            latest_message = (
                visible_messages.filter(conversation_id=conversation_id)
                .order_by("-created_at", "-id")
                .first()
            )
            generated_title_message = (
                ChatMessage.objects.filter(
                    conversation_id=conversation_id,
                    role=ChatMessage.ROLE_ASSISTANT,
                    is_system_call=True,
                )
                .order_by("-created_at", "-id")
                .first()
            )
            first_user_message = (
                visible_messages.filter(
                    conversation_id=conversation_id,
                    role=ChatMessage.ROLE_USER,
                )
                .order_by("created_at", "id")
                .first()
            )
            count = visible_messages.filter(conversation_id=conversation_id).count()

            summaries.append(
                {
                    "conversation_id": conversation_id,
                    "title": (
                        generated_title_message.content.strip()[:64]
                        if generated_title_message
                        and generated_title_message.content.strip()
                        else (
                            first_user_message.content[:64]
                            if first_user_message
                            else "Untitled chat"
                        )
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
            conversation_id=conversation_id,
            is_system_call=False,
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

    def delete(self, request, conversation_id: str):
        deleted_count, _ = ChatMessage.objects.filter(
            conversation_id=conversation_id
        ).delete()

        if deleted_count == 0:
            return Response(
                {"error": "Conversation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
