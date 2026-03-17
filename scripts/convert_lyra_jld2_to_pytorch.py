"""
VERSION : Lyra 2.1 to Current
Convert Lyra Lux/JLD2 model to PyTorch state_dict.

This converter is intentionally scoped to Lyra models trained by:
    LyraDataTrain/src/Train.jl
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Tuple

import h5py
import numpy as np
import torch
import torch.nn as nn


class LyraTorchModel(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.fc1 = nn.Linear(3, 64, bias=True)
        self.ln1 = nn.LayerNorm(64)
        self.fc2 = nn.Linear(64, 64, bias=True)
        self.fc3 = nn.Linear(64, 27, bias=True)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = torch.nn.functional.mish(self.fc1(x))
        x = self.ln1(x)
        x = torch.nn.functional.mish(self.fc2(x))
        x = self.fc3(x)
        return x


def _as_numpy(h5obj: Any) -> np.ndarray:
    arr = np.array(h5obj)
    # Only swap bytes when dtype is truly non-native endianness.
    if not arr.dtype.isnative:
        # NumPy 2.x removed ndarray.newbyteorder(); use dtype.newbyteorder instead.
        arr = arr.byteswap().view(arr.dtype.newbyteorder("="))
    return arr


def _resolve_node(node: Any, f: h5py.File) -> Any:
    """
    Resolve common JLD2 wrappers:
    - HDF5 object references
    - scalar datasets that contain references / structured scalars
    - scalar object arrays that wrap references
    """
    cur = node
    for _ in range(8):
        if isinstance(cur, h5py.Reference):
            cur = f[cur]
            continue

        if isinstance(cur, h5py.Dataset) and cur.shape == ():
            cur = cur[()]
            continue

        if isinstance(cur, np.ndarray) and cur.shape == () and cur.dtype == np.dtype("O"):
            cur = cur.item()
            continue

        if isinstance(cur, np.ndarray) and cur.shape == () and cur.dtype.names is not None:
            cur = cur[()]
            continue

        break
    return cur


def _read_tstate_parameters(f: h5py.File) -> Any:
    tstate = f["tstate"]

    # 2.1+ : tstate is a scalar Dataset containing a numpy.void structured scalar
    if isinstance(tstate, h5py.Dataset) and tstate.shape == ():
        val = tstate[()]
        if isinstance(val, np.void) and "parameters" in (val.dtype.names or ()):
            return val["parameters"]  # returns np.void, fields are object refs
        # fallback: try resolving as before
        tstate = _resolve_node(tstate, f)

    if isinstance(tstate, h5py.Group):
        return _resolve_node(tstate["parameters"], f)

    if isinstance(tstate, np.void):
        if "parameters" not in (tstate.dtype.names or ()):
            raise ValueError(f"tstate has no 'parameters' field. fields={tstate.dtype.names}")
        return tstate["parameters"]

    raise TypeError(f"Unsupported tstate node type: {type(tstate)}")


def _field_names(node: Any) -> Tuple[str, ...]:
    if isinstance(node, h5py.Group):
        return tuple(node.keys())
    if isinstance(node, h5py.Dataset):
        return tuple(node.dtype.names or ())
    if isinstance(node, np.void):
        return tuple(node.dtype.names or ())
    if isinstance(node, np.ndarray) and node.dtype.names is not None:
        return tuple(node.dtype.names)
    return ()


def _get_field(node: Any, name: str) -> Any:
    if isinstance(node, h5py.Group):
        return node[name]
    if isinstance(node, h5py.Dataset):
        return node[()][name]
    if isinstance(node, np.void):
        return node[name]
    if isinstance(node, np.ndarray) and node.dtype.names is not None:
        return node[name]
    raise TypeError(f"Unsupported node type for field access: {type(node)}")


def _read_field(node: Any, names: Tuple[str, ...], node_name: str, f: h5py.File) -> np.ndarray:
    available = _field_names(node)
    for n in names:
        if n in available:
            raw = _get_field(node, n)
            resolved = _resolve_node(raw, f)
            return _as_numpy(resolved)
    raise ValueError(f"{node_name} missing fields {names}. available={list(available)}")


def _to_1d(arr: np.ndarray, name: str) -> np.ndarray:
    if arr.ndim == 1:
        return arr
    if arr.ndim == 2 and 1 in arr.shape:
        return arr.reshape(-1)
    raise ValueError(f"{name} expected 1D or singleton-2D, got {arr.shape}")


def _read_lyra_weights_from_jld2(jld2_path: Path) -> Dict[str, np.ndarray]:
    with h5py.File(jld2_path, "r") as f:
        root = _read_tstate_parameters(f)

        # In 2.1, root is np.void; each layer field is also np.void with 'O' (object ref) leaves
        layer_1 = _resolve_node(_get_field(root, "layer_1"), f)
        layer_2 = _resolve_node(_get_field(root, "layer_2"), f)
        layer_3 = _resolve_node(_get_field(root, "layer_3"), f)
        layer_4 = _resolve_node(_get_field(root, "layer_4"), f)

        ln_w = _read_field(layer_2, ("weight", "gamma", "scale"), "layer_2", f)
        ln_b = _read_field(layer_2, ("bias", "beta", "shift"), "layer_2", f)
        w = {
            "fc1.weight": _read_field(layer_1, ("weight", "kernel"), "layer_1", f),
            "fc1.bias": _to_1d(_read_field(layer_1, ("bias",), "layer_1", f), "layer_1.bias"),
            "ln1.weight": _to_1d(ln_w, "layer_2.weight/scale"),
            "ln1.bias": _to_1d(ln_b, "layer_2.bias"),
            "fc2.weight": _read_field(layer_3, ("weight", "kernel"), "layer_3", f),
            "fc2.bias": _to_1d(_read_field(layer_3, ("bias",), "layer_3", f), "layer_3.bias"),
            "fc3.weight": _read_field(layer_4, ("weight", "kernel"), "layer_4", f),
            "fc3.bias": _to_1d(_read_field(layer_4, ("bias",), "layer_4", f), "layer_4.bias"),
        }
    return w


def _to_torch_state_dict(lyra_weights: Dict[str, np.ndarray]) -> Dict[str, torch.Tensor]:
    # In Lyra 2.1, all Dense weights are serialized as (in, out).
    # PyTorch Linear expects (out, in), so always transpose.
    transpose_keys = {"fc1.weight", "fc2.weight", "fc3.weight"}

    state: Dict[str, torch.Tensor] = {}
    for k, v in lyra_weights.items():
        arr = v.astype(np.float32)
        if k in transpose_keys:
            arr = arr.T
        state[k] = torch.from_numpy(arr)
    return state


def _verify_shapes(state: Dict[str, torch.Tensor]) -> None:
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
    for k, shp in expected.items():
        got = tuple(state[k].shape)
        if got != shp:
            raise ValueError(f"{k} shape mismatch: expected {shp}, got {got}")


def convert(jld2_path: Path, out_pt: Path, out_meta: Path | None) -> Tuple[Path, Path | None]:
    lyra_weights = _read_lyra_weights_from_jld2(jld2_path)

    # For Debug
    for k, v in lyra_weights.items():
        print(f"{k}: shape={v.shape}")

    state = _to_torch_state_dict(lyra_weights)
    _verify_shapes(state)

    model = LyraTorchModel()
    model.load_state_dict(state, strict=True)
    torch.save(model.state_dict(), out_pt)

    if out_meta is not None:
        meta = {
            "source": str(jld2_path),
            "format": "pytorch_state_dict",
            "architecture": "Linear(3,64)-Mish-LayerNorm(64)-Linear(64,64)-Mish-Linear(64,27)",
            "output": "27-dim offsets in OKLab for 9 colors",
            "notes": "Lyra-specific converter for Lux TrainState JLD2.",
        }
        out_meta.write_text(json.dumps(meta, indent=2), encoding="utf-8")

    return out_pt, out_meta


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert Lyra JLD2 model to PyTorch state_dict.")
    parser.add_argument("input_jld2", type=Path, help="Path to Lyra .jld2 model file")
    parser.add_argument("output_pt", type=Path, help="Path to output .pt file")
    parser.add_argument("--meta-json", type=Path, default=None, help="Optional metadata json output path")
    args = parser.parse_args()

    out_pt, out_meta = convert(args.input_jld2, args.output_pt, args.meta_json)
    print(f"Saved PyTorch model: {out_pt}")
    if out_meta is not None:
        print(f"Saved metadata: {out_meta}")


if __name__ == "__main__":
    main()
