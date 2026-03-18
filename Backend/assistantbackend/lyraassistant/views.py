from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import PredictQuerySerializer
from .predict_services import predict_from_oklch

from lyra_utils.color_oklab import hex_to_oklab_vec, oklab_to_oklch_vec
from .jitter import jitter_oklch


class PredictAPIView(APIView):

    def get(self, request):
        serializer = PredictQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        if "oklch" in serializer.validated_data:
            data = serializer.validated_data["oklch"]
            l, c, h = data["l"], data["c"], data["h"]
        else:
            hex_value = serializer.validated_data["hex"]
            oklab = hex_to_oklab_vec(hex_value)
            oklch = oklab_to_oklch_vec(oklab)
            l, c, h = float(oklch[0]), float(oklch[1]), float(oklch[2])

        if serializer.validated_data.get("jitter"):
            l, c, h = jitter_oklch(
                l,
                c,
                h,
                jitter_l=serializer.validated_data["jitter_l"],
                jitter_c=serializer.validated_data["jitter_c"],
                jitter_h=serializer.validated_data["jitter_h"],
                c_max=serializer.validated_data["jitter_c_max"],
            )

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