from rest_framework import serializers


class OKLCHSerializer(serializers.Serializer):
    oklch = serializers.CharField()

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