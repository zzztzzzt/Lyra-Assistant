import random
import numpy as np
import torch

from lyra_utils.color_oklab import (
    oklab_to_hex,
    oklab_to_oklch_vec,
    oklch_to_oklab_vec,
)

from .model import LyraTorchModel


@torch.no_grad()
def predict_palette_oklab(
    model: LyraTorchModel,
    main_oklab: np.ndarray,
    boldness: float = 1.0,
    device: str = "cpu",
) -> np.ndarray:
    # main_oklab shape: (3,) or (N,3)
    arr = np.asarray(main_oklab, dtype=np.float32)
    if arr.ndim == 1:
        arr = arr.reshape(1, 3)
    if arr.shape[1] != 3:
        raise ValueError(f"Expected last dim=3, got {arr.shape}")

    x = torch.from_numpy(arr).to(device)
    y_offset = model(x)  # (N, 27)

    # Align with Julia logic: y_pred = boldness * y_offset + repeat(main, 9)
    main_repeat = x.repeat(1, 9)  # (N, 27)
    y_pred = boldness * y_offset + main_repeat

    # Return as (N, 9, 3)
    return y_pred.reshape(-1, 9, 3).cpu().numpy()


def predict_palette_from_oklch(
    model: LyraTorchModel,
    l: float,
    c: float,
    h: float,
    boldness: float | None = None,
    device: str = "cpu",
) -> tuple[list[list[float]], list[str], float]:
    """
    Input: OKLCH (L, C, h) with L in [0, 1], h in degrees.
    Returns: (palette_oklch, palette_hex, boldness).
    """
    if boldness is None:
        boldness = random.uniform(1.0, 1.25)

    main_oklab = oklch_to_oklab_vec(np.array([l, c, h], dtype=np.float32))
    palette_oklab = predict_palette_oklab(model, main_oklab, boldness=boldness, device=device)

    colors = palette_oklab[0]  # (9, 3)
    palette_oklch = [oklab_to_oklch_vec(colors[i]).tolist() for i in range(9)]
    palette_hex = [oklab_to_hex(colors[i]) for i in range(9)]

    return palette_oklch, palette_hex, boldness