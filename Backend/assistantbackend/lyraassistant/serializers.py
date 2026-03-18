from rest_framework import serializers


class PredictQuerySerializer(serializers.Serializer):
    oklch = serializers.CharField(required=False, allow_blank=False)
    hex = serializers.CharField(required=False, allow_blank=False)
    jitter = serializers.BooleanField(required=False, default=False)
    jitter_l = serializers.FloatField(required=False, default=0.02)
    jitter_c = serializers.FloatField(required=False, default=0.04)
    jitter_h = serializers.FloatField(required=False, default=15.0)
    jitter_c_max = serializers.FloatField(required=False, default=0.4)

    def validate_oklch(self, value):
        parts = [p.strip() for p in value.split(",")]
        if len(parts) != 3:
            raise serializers.ValidationError("oklch must be L,C,h")

        try:
            l_val = float(parts[0])
            c_val = float(parts[1])
            h_val = float(parts[2])
        except ValueError:
            raise serializers.ValidationError("oklch values must be numbers")

        return {
            "l": l_val,
            "c": c_val,
            "h": h_val
        }

    def validate_hex(self, value):
        s = value.strip()
        if s.startswith("#"):
            s = s[1:]
        if len(s) == 3:
            s = "".join(ch * 2 for ch in s)
        if len(s) != 6:
            raise serializers.ValidationError("hex must be RRGGBB or RGB")
        try:
            int(s, 16)
        except ValueError:
            raise serializers.ValidationError("hex must be a valid hex string")
        return f"#{s.lower()}"

    def validate(self, attrs):
        has_oklch = "oklch" in attrs and attrs["oklch"] is not None
        has_hex = "hex" in attrs and attrs["hex"] is not None
        if has_oklch == has_hex:
            raise serializers.ValidationError("Provide exactly one of: oklch or hex")

        # Defensive bounds for jitter params
        attrs["jitter_l"] = max(0.0, min(float(attrs.get("jitter_l", 0.02)), 0.2))
        attrs["jitter_c"] = max(0.0, min(float(attrs.get("jitter_c", 0.04)), 0.2))
        attrs["jitter_h"] = max(0.0, min(float(attrs.get("jitter_h", 15.0)), 90.0))
        attrs["jitter_c_max"] = max(0.0, min(float(attrs.get("jitter_c_max", 0.4)), 1.0))
        return attrs