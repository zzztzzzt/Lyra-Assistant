import random


def _clamp(v: float, lo: float, hi: float) -> float:
    return lo if v < lo else hi if v > hi else v


def _wrap_hue(h: float) -> float:
    h = h % 360.0
    return h + 360.0 if h < 0 else h


def jitter_oklch(
    l: float,
    c: float,
    h: float,
    *,
    jitter_l: float = 0.02,
    jitter_c: float = 0.04,
    jitter_h: float = 15.0,
    c_max: float = 0.4,
):
    """
    Match the frontend jitter defaults (HomePage.tsx):
    l ±0.02, c ±0.04, h ±15, c clamped to [0..c_max], h wrapped to [0..360).
    """
    l2 = _clamp(l + random.uniform(-jitter_l, jitter_l), 0.0, 1.0)
    c2 = _clamp(c + random.uniform(-jitter_c, jitter_c), 0.0, c_max)
    h2 = _wrap_hue(h + random.uniform(-jitter_h, jitter_h))
    return l2, c2, h2

