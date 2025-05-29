from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from users.auth_views import login_view, RegisterView

urlpatterns = [
    # JWT Endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Custom Auth Endpoints
    path('users/login/', login_view, name='login'),
    path('users/register/', RegisterView.as_view(), name='register'),
] 