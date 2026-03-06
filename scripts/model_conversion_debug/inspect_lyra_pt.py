"""
Inspect a Lyra .pt (PyTorch state_dict) file.
Mirrors the Julia inspect_lyra_jld2.jl output format.
"""

import sys
import torch
import torch.nn as nn
import torch.nn.functional as F
from pathlib import Path


class LyraTorchModel_relu(nn.Module):
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = self.ln1(x)
        x = torch.relu(self.fc2(x))
        return self.fc3(x)


class LyraTorchModel_mish(nn.Module):
    def forward(self, x):
        x = F.mish(self.fc1(x))
        x = self.ln1(x)
        x = F.mish(self.fc2(x))
        return self.fc3(x)


def make_model(activation: str) -> nn.Module:
    base = LyraTorchModel_relu if activation == "relu" else LyraTorchModel_mish
    class M(base):
        def __init__(self):
            super().__init__()
            self.fc1 = nn.Linear(3, 64, bias=True)
            self.ln1 = nn.LayerNorm(64)
            self.fc2 = nn.Linear(64, 64, bias=True)
            self.fc3 = nn.Linear(64, 27, bias=True)
    return M()


def inspect_pt(pt_path: Path):
    print("⭐ ||||||  file  |||||| ⭐")
    print(pt_path)
    print()

    state = torch.load(pt_path, map_location="cpu")

    print("⭐ ||||||  state_dict keys  |||||| ⭐")
    for k, v in state.items():
        print(f"{k}  shape={tuple(v.shape)}  dtype={v.dtype}")
    print()

    # Shape compat check
    expected = {
        "fc1.weight": (64, 3),
        "fc1.bias": (64,),
        "ln1.weight": (64,),
        "ln1.bias": (64,),
        "fc2.weight": (64, 64),
        "fc2.bias": (64,),
        "fc3.weight": (27, 64),
        "fc3.bias": (27,),
    }

    print("⭐ ||||||  shape_compat  |||||| ⭐")
    all_ok = True
    for k, exp in expected.items():
        if k not in state:
            print(f"  MISSING  {k}")
            all_ok = False
            continue
        got = tuple(state[k].shape)
        status = "OK" if got == exp else "FAIL"
        if got != exp:
            all_ok = False
        print(f"{status}  {k}  expected={exp}  got={got}")
    print()

    # Test inference with both activations
    print("⭐ ||||||  inference_test  |||||| ⭐")
    test_input = torch.tensor([[0.5, 0.1, -0.1]]) # oklab shape

    for activation in ("relu", "mish"):
        try:
            m = make_model(activation)
            m.load_state_dict(state, strict=True)
            m.eval()
            with torch.no_grad():
                out = m(test_input)
            print(f"[{activation}]  output[:6] = {out[0,:6].tolist()}")
            print(f"[{activation}]  min={out.min().item():.4f}  max={out.max().item():.4f}  mean={out.mean().item():.4f}")
        except Exception as e:
            print(f"[{activation}]  ERROR: {e}")
    print()

    print("⭐ ||||||  converter_compat  |||||| ⭐")
    print(f"status: {'OK' if all_ok else 'FAIL'}")
    print(f"keys: {list(state.keys())}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python inspect_lyra_pt.py <path_to_.pt>")
        sys.exit(1)
    inspect_pt(Path(sys.argv[1]))


if __name__ == "__main__":
    main()