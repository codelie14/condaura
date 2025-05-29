from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, PasswordChangeView, NotificationViewSet
from .auth_views import login_view, RegisterView

router = DefaultRouter()
router.register(r'', UserViewSet)

notifications_router = DefaultRouter()
notifications_router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', login_view, name='login'),
    path('change-password/', PasswordChangeView.as_view(), name='change-password'),
    path('notifications/', include(notifications_router.urls)),
] 