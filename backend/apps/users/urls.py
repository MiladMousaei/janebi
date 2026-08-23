from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import AddressViewSet, LoginView, PasswordChangeView, ProfileView, RegisterView, logout_view

router = DefaultRouter()
router.register("addresses", AddressViewSet, basename="address")
urlpatterns = [
    path("register/", RegisterView.as_view()), path("login/", LoginView.as_view()),
    path("refresh/", TokenRefreshView.as_view()), path("logout/", logout_view),
    path("profile/", ProfileView.as_view()), path("change-password/", PasswordChangeView.as_view()),
    path("", include(router.urls)),
]
