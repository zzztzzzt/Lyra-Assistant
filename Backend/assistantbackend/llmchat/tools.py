import requests
from langchain_core.tools import tool

from lyraassistant.predict_services import predict_from_oklch

@tool
def predict_color_palette(l: float, c: float, h: float):
    """
    Generate a color palette prediction from OKLCH color space using LyraAssistant API.

    Parameters:
        l (float): Lightness in OKLCH color space. Range 0.0-1.0.
        c (float): Chroma (color intensity). Usually between 0.0-0.4.
        h (float): Hue angle in degrees. Range 0-360.

    Returns:
        {
            "palette_hex": list[str],
            "palette_oklch": list[list[float]],
            "boldness": float
        }
    """

    try:
        palette_oklch, palette_hex, boldness = predict_from_oklch(l, c, h)

        print("[FROM LYRA]", palette_hex);

        return {
            "palette_hex": palette_oklch,
            "palette_oklch": palette_hex,
            "boldness": boldness,
        }

    except Exception as e:
        return {"error": str(e)}