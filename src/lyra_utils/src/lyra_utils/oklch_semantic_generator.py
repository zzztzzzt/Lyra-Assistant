import random

class OKLCHSemanticGenerator:
    HUE_RANGES_BY_LIGHTNESS = {
        0.45: {
            "brown": (0, 105), "green": (105, 180), "teal": (180, 205),
            "blue": (205, 265), "purple": (265, 335), "pink": (335, 360), "red": (335, 25),
        },
        0.60: {
            "purple": [(0, 20), (245, 360)], "brown": (20, 90), "green": (90, 160),
            "teal": (160, 245), "red": (340, 30),
        },
        0.75: {
            "pink": [(0, 10), (350, 360)], "orange": (10, 75), "green": (75, 135),
            "lime": (135, 165), "teal": (165, 215), "blue": (210, 255),
            "purple": (255, 350), "red": (340, 25),
        },
        0.85: {
            "yellow": (95, 110), "red": (350, 20),
        }
    }

    CHROMA_RANGES_BY_CORE = {
        "blue": (0.08, 0.12), "purple": (0.10, 0.16), "pink": (0.08, 0.14),
        "green": (0.06, 0.10), "brown": (0.04, 0.08), "lime": (0.09, 0.14),
        "teal": (0.08, 0.12), "orange": (0.10, 0.15), "yellow": (0.08, 0.13),
        "red": (0.12, 0.18), "gray": (0.01, 0.04),
    }

    ALIASES = {
        "blue": ["blue","navy","navy blue","deep blue","dark blue","sky blue","baby blue","light blue","azure","cobalt","royal blue","denim","midnight blue"],
        "green": ["green","dark green","deep green","forest green","olive","olive green","moss","moss green","grass","grass green","emerald"],
        "teal": ["teal","cyan","aqua","turquoise","blue green","green blue","sea green","lagoon","ocean"],
        "purple": ["purple","violet","lavender","lilac","plum","grape","indigo","deep purple"],
        "pink": ["pink","hot pink","baby pink","light pink","rose","blush","salmon"],
        "red": ["red","crimson","scarlet","ruby","cherry","wine","burgundy"],
        "orange": ["orange","tangerine","coral","peach","burnt orange","apricot"],
        "yellow": ["yellow","gold","golden","amber","lemon","mustard","sunflower"],
        "brown": ["brown","coffee","chocolate","mocha","espresso","caramel","tan","beige","sand"],
        "gray": ["gray","grey","charcoal","slate","ash","silver"],
        "lime": ["lime","lime green","neon green"]
    }

    def __init__(self):
        self.alias_to_core = {}
        for core, arr in self.ALIASES.items():
            for a in arr:
                self.alias_to_core[a] = core
            self.alias_to_core[core] = core

    def normalize_name(self, text):
        text = text.lower()
        matches = [(alias, core) for alias, core in self.alias_to_core.items() if alias in text]
        if not matches:
            return None
        return max(matches, key=lambda x: len(x[0]))[1]

    def _pick_range(self, entry):
        return random.choice(entry) if isinstance(entry, list) else entry

    def _circular_lerp(self, a, b, t):
        diff = (b - a + 180) % 360 - 180
        return (a + diff * t) % 360

    def _normalize_hue_range(self, h1, h2):
        if (h2 - h1) % 360 < 180:
            return (h1 % 360, h2 % 360)
        return (h2 % 360, h1 % 360)

    def _random_hue(self, h_min, h_max):
        if h_min <= h_max:
            return random.uniform(h_min, h_max) % 360
        span = (360 - h_min) + h_max
        return (h_min + random.uniform(0, span)) % 360

    def _biased_hue(self, h_min, h_max):
        diff = (h_max - h_min + 180) % 360 - 180
        mid = (h_min + diff / 2) % 360
        spread = abs(h_max - h_min) / 6
        return self._random_hue(mid - spread, mid + spread)

    def get_hue_range(self, core, l):
        levels = sorted(lv for lv in self.HUE_RANGES_BY_LIGHTNESS if core in self.HUE_RANGES_BY_LIGHTNESS[lv])
        if not levels:
            return None

        if l <= levels[0]:
            return self._pick_range(self.HUE_RANGES_BY_LIGHTNESS[levels[0]][core])
        if l >= levels[-1]:
            return self._pick_range(self.HUE_RANGES_BY_LIGHTNESS[levels[-1]][core])

        lower = max(lv for lv in levels if lv < l)
        upper = min(lv for lv in levels if lv > l)
        ratio = (l - lower) / (upper - lower)

        r1 = self._pick_range(self.HUE_RANGES_BY_LIGHTNESS[lower][core])
        r2 = self._pick_range(self.HUE_RANGES_BY_LIGHTNESS[upper][core])

        h_min = self._circular_lerp(r1[0], r2[0], ratio)
        h_max = self._circular_lerp(r1[1], r2[1], ratio)

        return self._normalize_hue_range(h_min, h_max)

    def adjust_semantics(self, text, l, c):
        text = text.lower()
        if any(w in text for w in ["dark","deep","midnight","shadow"]):
            l -= 0.15
        if any(w in text for w in ["light","pale","soft","pastel"]):
            l += 0.15
        if any(w in text for w in ["muted","dusty","desaturated","grayish","subdued"]):
            c *= 0.6
        if any(w in text for w in ["vivid","neon","rich","saturated","intense","bright"]):
            c *= 1.35
        return max(0.3, min(0.98, l)), max(0.01, min(0.2, c))

    def handle_special_cases(self, text):
        text = text.lower()
        if "beige" in text:
            return 0.85, 0.03, random.uniform(80, 95)
        if "gold" in text:
            return 0.8, 0.12, random.uniform(85, 100)
        return None

    def generate(self, user_input, target_l=None, target_c=None):
        core = self.normalize_name(user_input)
        if not core:
            return {"error": f"Color '{user_input}' not recognized"}

        special = self.handle_special_cases(user_input)
        if special:
            l, c, h = special
            return {
                "name": core, "L": round(l, 3), "C": round(c, 3), "H": round(h, 2),
                "oklch_css": f"oklch({l:.3f} {c:.3f} {h:.1f})"
            }

        l = target_l if target_l is not None else random.uniform(0.45, 0.85)
        c_min, c_max = self.CHROMA_RANGES_BY_CORE.get(core, (0.06, 0.12))
        c = target_c if target_c is not None else random.uniform(c_min, c_max)

        l, c = self.adjust_semantics(user_input, l, c)

        if core == "gray":
            return {
                "name": core, "L": round(l, 3), "C": round(c, 3), "H": 0,
                "oklch_css": f"oklch({l:.3f} {c:.3f} 0)"
            }

        h_range = self.get_hue_range(core, l)
        if not h_range:
            return {"error": "No hue range available for this lightness"}

        h = self._biased_hue(h_range[0], h_range[1])

        return {
            "name": core, "L": round(l, 3), "C": round(c, 3), "H": round(h, 2),
            "oklch_css": f"oklch({l:.3f} {c:.3f} {h:.1f})"
        }
