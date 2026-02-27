import os
import ollama

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import ChatSerializer


def get_ollama_client() -> ollama.Client:
    host = os.getenv("OLLAMA_HOST")
    return ollama.Client(host=host)


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
        model = (
            serializer.validated_data.get("model")
            or os.getenv("OLLAMA_MODEL")
        )

        if not model:
            return Response(
                {"error": "Model is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            response = get_ollama_client().chat(
                model=model,
                messages=[{"role": "user", "content": message}],
                # Wait a maximum of 30 seconds
                options={"timeout": 30},
            )
        except Exception as exc:
            return Response(
                {
                    "error": "Failed to call Ollama.",
                    # For Debug
                    #"detail": str(exc),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        reply = response.get("message", {}).get("content", "")

        return Response(
            {
                "model": model,
                "message": message,
                "reply": reply,
            }
        )
