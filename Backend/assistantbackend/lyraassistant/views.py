from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import OKLCHSerializer
from .predict_services import predict_from_oklch


class PredictAPIView(APIView):

    def get(self, request):
        serializer = OKLCHSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data["oklch"]
        l, c, h = data["l"], data["c"], data["h"]

        try:
            palette_oklch, palette_hex, boldness = predict_from_oklch(l, c, h)
        except RuntimeError:
            return Response(
                {"error": "Model not found"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            return Response(
                {"error": "An error happened during prediction"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            "status": "ok",
            "mode": "oklch",
            "input_oklch": [l, c, h],
            "palette_hex": palette_hex,
            "palette_oklch": palette_oklch,
            "boldness": boldness,
        })