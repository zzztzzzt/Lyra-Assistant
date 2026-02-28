import argparse
import random
from pathlib import Path

import numpy as np

from lyra_inference.model import load_model
from lyra_inference.inference import predict_palette_oklab

from lyra_utils.color_oklab import oklab_to_hex, oklab_to_oklch_vec, oklch_to_oklab_vec


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
