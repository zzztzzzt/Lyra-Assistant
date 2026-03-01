from pathlib import Path
from django.conf import settings

from lyra_inference.model import load_model
from lyra_inference.inference import predict_palette_from_oklch

_cached_model = None
_cached_model_path = None


def get_model_path():
    base = getattr(settings, "BASE_DIR", None)
    if base is None:
        return None

    for key in ("EXTERNAL_CUSTOM_AI_MODEL_PATH", "EXTERNAL_NEWEST_LYRA_MODEL_PATH"):
        raw = getattr(settings, key, None) or ""
        if not raw.strip():
            continue

        p = Path(raw.strip())
        path = p if p.is_absolute() else (base / raw).resolve()
        if path.exists():
            return path

    return None


def get_model():
    global _cached_model, _cached_model_path

    path = get_model_path()
    if path is None:
        return None

    if _cached_model and _cached_model_path == path:
        return _cached_model

    _cached_model = load_model(path, device="cpu")
    _cached_model_path = path
    return _cached_model


def predict_from_oklch(l, c, h):
    model = get_model()
    if model is None:
        raise RuntimeError("Model not found")

    return predict_palette_from_oklch(
        model, l, c, h, boldness=None, device="cpu"
    )