import requests
from langchain_core.tools import tool

from lyraassistant.predict_services import predict_from_oklch
from lyra_utils.oklch_semantic_generator import OKLCHSemanticGenerator

_semantic_generator = OKLCHSemanticGenerator()


@tool
def pick_oklch_by_semantics(user_input: str):
    """
    Pick a single OKLCH color by semantic name (e.g. "blue", "deep teal", "pastel pink").

    This tool returns one randomized OKLCH sample that matches the requested color semantics.

    Parameters:
        user_input (str): The user's color request text.

    Returns:
        {
            "name": str,
            "L": float,
            "C": float,
            "H": float,
            "oklch_css": str
        }
    """
    try:
        result = _semantic_generator.generate(
            user_input=user_input,
        )
        print("[FROM SEMANTIC]", {"input": user_input, "result": result})
        return result
    except Exception as e:
        return {"error": str(e)}

@tool
def predict_color_palette(
    l: float,
    c: float,
    h: float,
):
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

        print("[FROM LYRA]", palette_hex)

        return {
            "palette_hex": palette_hex,
            "palette_oklch": palette_oklch,
            "boldness": boldness,
        }

    except Exception as e:
        return {"error": str(e)}
