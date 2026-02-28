from pathlib import Path

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET

from lyra_inference.model import load_model
from lyra_inference.inference import predict_palette_from_oklch

# Cached model and device; cleared when model path changes
_cached_model = None
_cached_model_path = None


def _get_model_path():
    """Resolve model path: prefer EXTERNAL_CUSTOM_AI_MODEL_PATH, else EXTERNAL_NEWEST_LYRA_MODEL_PATH."""
    base = getattr(settings, "BASE_DIR", None)
    if base is None:
        return None
    for key in ("EXTERNAL_CUSTOM_AI_MODEL_PATH", "EXTERNAL_NEWEST_LYRA_MODEL_PATH"):
        raw = getattr(settings, key, None) or ""
        if not raw or not str(raw).strip():
            continue
        raw = str(raw).strip()
        p = Path(raw)
        path = p if p.is_absolute() else (base / raw).resolve()
        if path.exists():
            return path
    return None


def _get_model():
    global _cached_model, _cached_model_path
    path = _get_model_path()
    if path is None:
        return None, None
    if _cached_model is not None and _cached_model_path == path:
        return _cached_model, path
    try:
        _cached_model = inference.load_model(path, device="cpu")
        _cached_model_path = path
        return _cached_model, path
    except Exception:
        return None, path


def index(request):
    return HttpResponse("Hello, world. You're at the lyra-assistant index.")


@require_GET
def predict(request):
    """
    GET /lyraassistant/predict?oklch=L,C,h
    Returns JSON: status, mode, input_oklch, palette_hex, palette_oklch, boldness.
    """
    oklch_param = request.GET.get("oklch", "").strip()
    if not oklch_param:
        return JsonResponse(
            {"error": "Missing query parameter: oklch=L,C,h (e.g. oklch=0.92,0.141,252)"},
            status=400,
        )
    parts = [p.strip() for p in oklch_param.split(",")]
    if len(parts) != 3:
        return JsonResponse(
            {"error": "oklch must be three numbers: L,C,h (e.g. 0.92,0.141,252)"},
            status=400,
        )
    try:
        l_val = float(parts[0])
        c_val = float(parts[1])
        h_val = float(parts[2])
    except ValueError:
        return JsonResponse({"error": "oklch values must be numbers"}, status=400)

    model, _ = _get_model()
    if model is None:
        return JsonResponse(
            {"error": "No Lyra model found. Set EXTERNAL_CUSTOM_AI_MODEL_PATH or EXTERNAL_NEWEST_LYRA_MODEL_PATH."},
            status=503,
        )

    try:
        palette_oklch, palette_hex, boldness = inference.predict_palette_from_oklch(
            model, l_val, c_val, h_val, boldness=None, device="cpu"
        )
    except Exception as e:
        return JsonResponse({"error": f"Prediction failed: {e!s}"}, status=500)

    return JsonResponse({
        "status": "ok",
        "mode": "oklch",
        "input_oklch": [l_val, c_val, h_val],
        "palette_hex": palette_hex,
        "palette_oklch": palette_oklch,
        "boldness": boldness,
    })