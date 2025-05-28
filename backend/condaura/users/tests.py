from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from .models import Notification

User = get_user_model()

class UserModelTests(TestCase):
    """Tests pour le modèle User"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='password123',
            first_name='Admin',
            last_name='User',
            user_id='ADMIN001',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        
        self.regular_user = User.objects.create_user(
            username='user@example.com',
            email='user@example.com',
            password='password123',
            first_name='Regular',
            last_name='User',
            user_id='USER001',
            role='reviewer',
            department='IT'
        )
    
    def test_user_creation(self):
        """Test la création d'un utilisateur"""
        self.assertEqual(User.objects.count(), 2)
        self.assertEqual(self.admin_user.email, 'admin@example.com')
        self.assertEqual(self.regular_user.department, 'IT')
        self.assertEqual(self.regular_user.role, 'reviewer')
    
    def test_user_str_representation(self):
        """Test la représentation en chaîne d'un utilisateur"""
        expected_str = f"Regular User (user@example.com)"
        self.assertEqual(str(self.regular_user), expected_str)
    
    def test_user_manager_relationship(self):
        """Test la relation manager-subordonné"""
        self.regular_user.manager = self.admin_user
        self.regular_user.save()
        
        self.assertEqual(self.regular_user.manager, self.admin_user)
        self.assertIn(self.regular_user, self.admin_user.subordinates.all())

class NotificationModelTests(TestCase):
    """Tests pour le modèle Notification"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='password123',
            first_name='Test',
            last_name='User',
            user_id='TEST001'
        )
        
        self.notification = Notification.objects.create(
            user=self.user,
            type='system',
            title='Test Notification',
            message='This is a test notification',
            link='/test'
        )
    
    def test_notification_creation(self):
        """Test la création d'une notification"""
        self.assertEqual(Notification.objects.count(), 1)
        self.assertEqual(self.notification.title, 'Test Notification')
        self.assertEqual(self.notification.user, self.user)
        self.assertFalse(self.notification.is_read)
    
    def test_notification_str_representation(self):
        """Test la représentation en chaîne d'une notification"""
        expected_str = f"Test Notification (test@example.com)"
        self.assertEqual(str(self.notification), expected_str)
    
    def test_notification_ordering(self):
        """Test l'ordre des notifications (la plus récente en premier)"""
        notification2 = Notification.objects.create(
            user=self.user,
            type='system',
            title='Second Notification',
            message='This is a second test notification'
        )
        
        notifications = Notification.objects.all()
        self.assertEqual(notifications[0], notification2)
        self.assertEqual(notifications[1], self.notification)

class UserAPITests(TestCase):
    """Tests pour l'API User"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.admin_user = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='password123',
            first_name='Admin',
            last_name='User',
            user_id='ADMIN001',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        
        self.regular_user = User.objects.create_user(
            username='user@example.com',
            email='user@example.com',
            password='password123',
            first_name='Regular',
            last_name='User',
            user_id='USER001',
            role='reviewer'
        )
    
    def test_login_jwt(self):
        """Test l'authentification JWT"""
        url = reverse('token_obtain_pair')
        data = {
            'username': 'admin@example.com',
            'password': 'password123'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
        # Utiliser le token pour accéder à une ressource protégée
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        
        # Test accès à l'API utilisateurs
        users_url = reverse('user-list')
        response = self.client.get(users_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_user_me_endpoint(self):
        """Test l'endpoint 'me' pour récupérer le profil utilisateur"""
        self.client.force_authenticate(user=self.regular_user)
        
        url = reverse('user-me')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.regular_user.email)
        self.assertEqual(response.data['role'], self.regular_user.role)
    
    def test_user_create_permission(self):
        """Test que seuls les admins peuvent créer des utilisateurs via l'API"""
        url = reverse('user-list')
        data = {
            'username': 'new@example.com',
            'email': 'new@example.com',
            'password': 'password123',
            'first_name': 'New',
            'last_name': 'User',
            'user_id': 'NEW001',
            'role': 'viewer'
        }
        
        # Non authentifié
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Utilisateur régulier
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Admin
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 3)

class NotificationAPITests(TestCase):
    """Tests pour l'API Notification"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='password123',
            first_name='Test',
            last_name='User',
            user_id='TEST001'
        )
        
        # Créer quelques notifications
        for i in range(3):
            Notification.objects.create(
                user=self.user,
                type='system',
                title=f'Notification {i+1}',
                message=f'This is notification {i+1}'
            )
        
        self.client.force_authenticate(user=self.user)
    
    def test_list_notifications(self):
        """Test la récupération des notifications"""
        url = reverse('notification-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)
    
    def test_mark_notification_read(self):
        """Test le marquage d'une notification comme lue"""
        notification = Notification.objects.first()
        url = reverse('notification-mark-read', args=[notification.id])
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
    
    def test_mark_all_notifications_read(self):
        """Test le marquage de toutes les notifications comme lues"""
        url = reverse('notification-mark-all-read')
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Vérifier que toutes les notifications sont marquées comme lues
        self.assertEqual(Notification.objects.filter(is_read=True).count(), 3)
