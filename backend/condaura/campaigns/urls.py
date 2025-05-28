from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CampaignViewSet, CampaignScopeViewSet

router = DefaultRouter()
router.register(r'', CampaignViewSet)

scopes_router = DefaultRouter()
scopes_router.register(r'', CampaignScopeViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('scopes/', include(scopes_router.urls)),
] 