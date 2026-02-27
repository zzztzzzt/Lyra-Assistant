import json
import os

import ollama
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods


def _get_ollama_client() -> ollama.Client:
    host = os.getenv("OLLAMA_HOST")
    return ollama.Client(host=host)


@require_GET
def health(request):
    return JsonResponse(
        {
            "status": "ok",
            "service": "gemmachat",
            "default_model": os.getenv("OLLAMA_MODEL"),
        }
    )


@csrf_exempt
@require_http_methods(["POST"])
def chat(request):
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload."}, status=400)

    message = payload.get("message", "")
    if not isinstance(message, str) or not message.strip():
        return JsonResponse({"error": "`message` must be a non-empty string."}, status=400)

    model = payload.get("model") or os.getenv("OLLAMA_MODEL")

    try:
        response = _get_ollama_client().chat(
            model=model,
            messages=[{"role": "user", "content": message.strip()}],
        )
    except Exception as exc:
        return JsonResponse(
            {
                "error": "Failed to call Ollama.",
                "detail": str(exc),
            },
            status=502,
        )

    reply = response.get("message", {}).get("content", "")

    return JsonResponse(
        {
            "model": model,
            "message": message.strip(),
            "reply": reply,
        }
    )
