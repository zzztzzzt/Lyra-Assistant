from __future__ import annotations

import math
from typing import Iterable

import numpy as np


def _srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _linear_to_srgb(c: float) -> float:
    c = float(np.clip(c, 0.0, 1.0))
    return 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055


_M1 = np.array(
    [
        [0.4122214708, 0.5363325363, 0.0514459929],
        [0.2119034982, 0.6806995451, 0.1073969566],
        [0.0883024619, 0.2817188376, 0.6299787005],
    ],
    dtype=np.float64,
)

_M2 = np.array(
    [
        [0.2104542553, 0.7936177850, -0.0040720468],
        [1.9779984951, -2.4285922050, 0.4505937099],
        [0.0259040371, 0.7827717662, -0.8086757660],
    ],
    dtype=np.float64,
)

_M2_INV = np.array(
    [
        [1.0, 0.3963377774, 0.2158037573],
        [1.0, -0.1055613458, -0.0638541728],
        [1.0, -0.0894841775, -1.2914855480],
    ],
    dtype=np.float64,
)

_M1_INV = np.array(
    [
        [4.0767416621, -3.3077115913, 0.2309699292],
        [-1.2684380046, 2.6097574011, -0.3413193965],
        [-0.0041960863, -0.7034186147, 1.7076147010],
    ],
    dtype=np.float64,
)


def _as_vec3(x: Iterable[float] | np.ndarray) -> np.ndarray:
    v = np.asarray(list(x) if not isinstance(x, np.ndarray) else x, dtype=np.float32).reshape(-1)
    if v.shape[0] != 3:
        raise ValueError(f"Expected 3 elements, got shape {v.shape}")
    return v


def hex_to_oklab_vec(hex_str: str) -> np.ndarray:
    """
    Julia equivalent: ColorOKLab.hex_to_oklab_vec
    Input: '#RRGGBB' or 'RRGGBB'
    Output: np.float32 array [L, a, b]
    """
    s = hex_str.strip().lstrip("#")
    if len(s) != 6:
        raise ValueError(f"Expected 6 hex chars, got {len(s)} in {hex_str!r}")

    r = int(s[0:2], 16) / 255.0
    g = int(s[2:4], 16) / 255.0
    b = int(s[4:6], 16) / 255.0

    l_rgb = np.array([_srgb_to_linear(r), _srgb_to_linear(g), _srgb_to_linear(b)], dtype=np.float64)
    lms = _M1 @ l_rgb

    lms_prime = np.sign(lms) * np.abs(lms) ** (1.0 / 3.0)
    lab = _M2 @ lms_prime
    return lab.astype(np.float32)


def oklab_to_hex(lab: Iterable[float] | np.ndarray) -> str:
    """
    Julia equivalent: ColorOKLab.oklab_to_hex
    Input: [L, a, b]
    Output: '#RRGGBB' (uppercase)
    """
    L, a, b = _as_vec3(lab).astype(np.float64)

    lms_prime = _M2_INV @ np.array([L, a, b], dtype=np.float64)
    lms = np.sign(lms_prime) * (np.abs(lms_prime) ** 3)
    l_rgb = _M1_INV @ lms
    rgb = np.array([_linear_to_srgb(c) for c in l_rgb], dtype=np.float64)

    rgb255 = np.clip(np.round(rgb * 255.0), 0.0, 255.0).astype(np.int64)
    return f"#{rgb255[0]:02X}{rgb255[1]:02X}{rgb255[2]:02X}"


def oklch_to_oklab_vec(oklch: Iterable[float] | np.ndarray) -> np.ndarray:
    """
    Julia equivalent: ColorOKLab.oklch_to_oklab_vec
    Input: [L, C, h_deg]
    Output: np.float32 array [L, a, b]
    """
    L, C, h_deg = _as_vec3(oklch)
    h_rad = math.radians(float(h_deg))
    a = float(C) * math.cos(h_rad)
    b = float(C) * math.sin(h_rad)
    return np.array([float(L), a, b], dtype=np.float32)


def oklab_to_oklch_vec(lab: Iterable[float] | np.ndarray) -> np.ndarray:
    """
    Julia equivalent: ColorOKLab.oklab_to_oklch_vec
    Input: [L, a, b]
    Output: np.float32 array [L, C, h_deg] with h in [0,360)
    """
    L, a, b = _as_vec3(lab)
    C = float(math.sqrt(float(a) ** 2 + float(b) ** 2))
    h_rad = math.atan2(float(b), float(a))
    h_deg = math.degrees(h_rad)
    if h_deg < 0:
        h_deg += 360.0
    return np.array([float(L), C, float(h_deg)], dtype=np.float32)

