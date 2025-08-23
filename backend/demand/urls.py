from django.urls import path
from .views import DemandCreateView

urlpatterns = [
    path("create/", DemandCreateView.as_view(), name="create-demand"),
]