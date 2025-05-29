from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.models import Notification
from .views import NotificationViewSet

# API view for getting unread notification count
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    """Get the number of unread notifications for the current user"""
    count = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({'count': count})

# Create a router for notifications
router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    # The frontend is looking for this exact path
    path('notifications/notifications/unread-count/', unread_count, name='notification-unread-count'),
    path('', include(router.urls)),
] 