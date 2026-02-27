from __future__ import annotations

import argparse
import random
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn

from lyra_utils.color_oklab import oklab_to_hex, oklab_to_oklch_vec, oklch_to_oklab_vec


class LyraTorchModel(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.fc1 = nn.Linear(3, 64, bias=True)
        self.ln1 = nn.LayerNorm(64)
        self.fc2 = nn.Linear(64, 64, bias=True)
        self.fc3 = nn.Linear(64, 27, bias=True)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = torch.relu(self.fc1(x))
        x = self.ln1(x)
        x = torch.relu(self.fc2(x))
        x = self.fc3(x)
        return x


def load_model(pt_path: Path, device: str = "cpu") -> LyraTorchModel:
    model = LyraTorchModel().to(device)
    state = torch.load(pt_path, map_location=device)
    model.load_state_dict(state, strict=True)
    model.eval()
    return model


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


def main() -> None:
    parser = argparse.ArgumentParser(description="Lyra PyTorch inference demo")
    parser.add_argument("model_pt", type=Path, help="Converted Lyra .pt state_dict path")
    parser.add_argument("--oklch", nargs=3, type=float, required=True, metavar=("L", "C", "h"))
    parser.add_argument("--boldness", type=float, default=None, help="If omitted, random in [1.0, 1.25]")
    parser.add_argument("--seed", type=int, default=None, help="Optional seed for boldness randomness")
    args = parser.parse_args()

    model = load_model(args.model_pt)

    if args.seed is not None:
        random.seed(args.seed)

    boldness = float(args.boldness) if args.boldness is not None else (random.random() * (1.25 - 1.0) + 1.0)

    main_oklab = oklch_to_oklab_vec(np.array(args.oklch, dtype=np.float32))
    palette_oklab = predict_palette_oklab(model, main_oklab, boldness=boldness)

    # Print in a backend-friendly form: boldness, then 9 colors as OKLCH + HEX
    colors = palette_oklab[0]  # (9,3)
    palette_oklch = [oklab_to_oklch_vec(colors[i]).tolist() for i in range(9)]
    palette_hex = [oklab_to_hex(colors[i]) for i in range(9)]

    print({"boldness": boldness, "palette_oklch": palette_oklch, "palette_hex": palette_hex})


if __name__ == "__main__":
    main()
