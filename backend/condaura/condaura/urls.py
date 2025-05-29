"""
URL configuration for condaura project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from .views import home
from .auth_urls import urlpatterns as auth_urlpatterns

from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
   openapi.Info(
      title="Condaura API",
      default_version='v1',
      description="API pour la plateforme de revue d'accès Condaura",
      terms_of_service="https://www.condaura.com/terms/",
      contact=openapi.Contact(email="contact@condaura.com"),
      license=openapi.License(name="Proprietary"),
   ),
   public=True,
   permission_classes=(permissions.IsAuthenticated,),
)

urlpatterns = [
    # Home page
    path('', home, name='home'),
    
    # API Documentation
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API Authentication - Direct routes without authentication requirements
    path('api/', include(auth_urlpatterns)),
    
    # API Endpoints - Protected routes
    path('api/users/', include('users.urls')),
    path('api/campaigns/', include('campaigns.urls')),
    path('api/', include('access.urls')),
    
    # New API Endpoints
    path('api/access_review/', include('access_review.urls')),
    path('api/', include('notifications.urls')),
]

# Add debug toolbar URLs in development
if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [path('__debug__/', include(debug_toolbar.urls))]
    
    # Serve media files in development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
