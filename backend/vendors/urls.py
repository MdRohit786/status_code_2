from django.urls import path
from .views import VendorNearestOrdersView,AcceptOrderView,VendorRegisterView,VendorLoginView,DeliverOrderView

urlpatterns = [
    path('nearest-orders/', VendorNearestOrdersView.as_view(), name='vendor-nearest-orders'),
    path('register/', VendorRegisterView.as_view(), name='vendor-register'),
    path('login/', VendorLoginView.as_view(), name='vendor-login'),
    path('accept-order/', AcceptOrderView.as_view(), name='accept-order'),
    path('deliver-order/', DeliverOrderView.as_view(), name='deliver-order'),
]