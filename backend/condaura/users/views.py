from django.shortcuts import render
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q
import csv
import io

from .serializers import (
    UserSerializer, 
    UserDetailSerializer, 
    RegisterSerializer,
    PasswordChangeSerializer,
    NotificationSerializer
)
from .models import Notification
from .services import NotificationService

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return UserDetailSerializer
        return UserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAdminUser()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def notifications(self, request):
        """Get current user notifications"""
        notifications = Notification.objects.filter(user=request.user)
        page = self.paginate_queryset(notifications)
        if page is not None:
            serializer = NotificationSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_notification_read(self, request):
        """Mark a notification as read"""
        notification_id = request.data.get('notification_id')
        if not notification_id:
            return Response({'error': 'Notification ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify the notification belongs to the user
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
        
        success = NotificationService.mark_as_read(notification_id)
        if success:
            return Response({'status': 'Notification marked as read'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Failed to mark notification as read'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def mark_all_notifications_read(self, request):
        """Mark all notifications as read"""
        success = NotificationService.mark_all_as_read(request.user.id)
        if success:
            return Response({'status': 'All notifications marked as read'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Failed to mark notifications as read'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def import_csv(self, request):
        """Import users from CSV file"""
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        csv_file = request.FILES['file']
        if not csv_file.name.endswith('.csv'):
            return Response({'error': 'File is not CSV'}, status=status.HTTP_400_BAD_REQUEST)
        
        decoded_file = csv_file.read().decode('utf-8')
        csv_data = csv.DictReader(io.StringIO(decoded_file))
        
        users_created = 0
        errors = []
        
        for row in csv_data:
            try:
                # Check for required fields
                required_fields = ['user_id', 'email', 'first_name', 'last_name']
                missing_fields = [field for field in required_fields if field not in row or not row[field]]
                
                if missing_fields:
                    errors.append(f"Row missing required fields: {', '.join(missing_fields)}")
                    continue
                
                # Check if user already exists
                if User.objects.filter(Q(user_id=row['user_id']) | Q(email=row['email'])).exists():
                    errors.append(f"User with ID {row['user_id']} or email {row['email']} already exists")
                    continue
                
                # Create user with default password
                user = User.objects.create_user(
                    username=row['email'],
                    email=row['email'],
                    first_name=row['first_name'],
                    last_name=row['last_name'],
                    user_id=row['user_id'],
                    department=row.get('department', ''),
                    password='ChangeMe123!'  # Default password to be changed on first login
                )
                
                # Set manager if provided
                if 'manager_email' in row and row['manager_email']:
                    manager = User.objects.filter(email=row['manager_email']).first()
                    if manager:
                        user.manager = manager
                        user.save()
                
                users_created += 1
                
                # Create welcome notification
                NotificationService.create_notification(
                    user.id,
                    'system',
                    'Bienvenue sur Condaura',
                    f'Bonjour {user.first_name}, bienvenue sur la plateforme Condaura ! Veuillez changer votre mot de passe par défaut.',
                    '/profile/change-password',
                    True  # Send email
                )
                
            except Exception as e:
                errors.append(f"Error processing row: {str(e)}")
        
        return Response({
            'users_created': users_created,
            'errors': errors
        }, status=status.HTTP_200_OK)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class PasswordChangeView(generics.UpdateAPIView):
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = self.get_object()
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': ['Wrong password.']}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        # Create notification
        NotificationService.create_notification(
            user.id,
            'system',
            'Mot de passe modifié',
            'Votre mot de passe a été modifié avec succès.',
            '',
            False  # No email
        )
        
        return Response({'status': 'password set'}, status=status.HTTP_200_OK)

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        try:
            notification = self.get_queryset().get(pk=pk)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
        
        notification.is_read = True
        notification.save()
        return Response({'status': 'Notification marked as read'}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'All notifications marked as read'}, status=status.HTTP_200_OK)
