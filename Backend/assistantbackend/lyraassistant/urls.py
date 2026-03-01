from django.urls import path

from .views import PredictAPIView

app_name = "lyraassistant"
urlpatterns = [
    path("predict/", PredictAPIView.as_view(), name="predict"),
]