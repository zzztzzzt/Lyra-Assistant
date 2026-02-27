from rest_framework import serializers


class ChatSerializer(serializers.Serializer):
    message = serializers.CharField(trim_whitespace=True)
    model = serializers.CharField(required=False, allow_blank=True)