from django.urls import path
from .views import DemandCreateView,UserProfileView,UserLoginView,UserRegisterView,test_django_email_settings

urlpatterns = [
    path("demand/create/", DemandCreateView.as_view(), name="create-demand"),
    path('user/register/', UserRegisterView.as_view(), name='user-register'),
    path('user/login/', UserLoginView.as_view(), name='user-login'),
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
]