import os
import uuid
import json
import re
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


def try_parse_tool_call(text: str):
    try:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if not match:
            return None

        data = json.loads(match.group())

        name = data.get("name")
        args = data.get("parameters") or data.get("args") or {}

        if not name:
            return None

        return {
            "name": name,
            "args": args,
            "id": str(uuid.uuid4()),
        }

    except Exception:
        return None


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
                    "You are now working with Lyra, a professional color-harmony AI Model. \n"
                    "If the user asks for colors, color palettes, gradients, or Lyra color prediction, you MUST call tools. "
                    "Otherwise DON'T call pick_oklch_by_semantics & predict_color_palette, just normally chat with user ( and DON'T LET THEM KNOW that you've gone through the above considerations ), don't reply colors to them. \n"
                    "If you decide call tools, you MUST call tools in below exact order : \n"
                    "1) pick_oklch_by_semantics \n"
                    "2) predict_color_palette \n"
                    "( After you call pick_oklch_by_semantics, use the L/C/H values ( The decimal parts of L/C/H values must be retained in full ) from pick_oklch_by_semantics to call predict_color_palette. ) \n"
                    "When describing palettes ( describe it only if user asks for colors, color palettes, gradients, or Lyra color prediction ), always list all HEX colors in order. "
                    "And at final, you need to also have some not related conversations with user. \n"
                    "Finally, when answering users, DON'T LET THEM KNOW that you've gone through the above considerations IF THEY DON'T ASK. "
                    "also DON'T LET THEM KNOW that you can call tools IF THEY DON'T ASK. "
                )
            )
        ]

        for msg in history:
            if msg["role"] == "user":
                langchain_messages.append(HumanMessage(content=msg["content"]))
            else:
                langchain_messages.append(AIMessage(content=msg["content"]))

        langchain_messages.append(HumanMessage(content=message))

        tools_by_name = {
            "pick_oklch_by_semantics": pick_oklch_by_semantics,
            "predict_color_palette": predict_color_palette,
        }

        MAX_TOOL_CALL_ROUNDS = 5

        for step in range(MAX_TOOL_CALL_ROUNDS):
            ai_msg = llm_invoker.invoke(langchain_messages)
            langchain_messages.append(ai_msg)

            tool_calls = ai_msg.tool_calls or []

            # Fallback : parse tool call from text if no structured tool_calls
            if not tool_calls:
                parsed = try_parse_tool_call(ai_msg.content)
                if parsed:
                    tool_calls = [parsed]

            if not tool_calls:
                reply = normalize_ai_content(ai_msg.content)
                break

            for tool_call in tool_calls:
                tool_name = tool_call.get("name")
                tool_impl = tools_by_name.get(tool_name)

                if not tool_impl:
                    continue

                args = tool_call.get("args", {})
                result = tool_impl.invoke(args)

                hint = ""

                if tool_name == "pick_oklch_by_semantics":
                    hint = (
                        "\n\nIMPORTANT:\n"
                        "You MUST now call `predict_color_palette` using the L, C, H values from this result ( please turn them to l, c, h, not L, C, H ).\n"
                        "Do NOT answer yet.\n"
                    )

                langchain_messages.append(
                    ToolMessage(
                        content=str(result) + hint,
                        tool_call_id=tool_call["id"],
                        name=tool_name,
                    )
                )

        else:
            reply = "Something went wrong in tool execution loop."

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
