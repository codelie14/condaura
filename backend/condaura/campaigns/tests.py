from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
import datetime

from .models import Campaign, CampaignScope
from .services import CampaignService
from access.models import Access, Review

User = get_user_model()

class CampaignModelTests(TestCase):
    """Tests pour le modèle Campaign"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='password123',
            first_name='Admin',
            last_name='User',
            user_id='ADMIN001',
            role='admin',
            is_staff=True
        )
        
        self.campaign = Campaign.objects.create(
            name='Test Campaign',
            description='A test campaign',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + datetime.timedelta(days=7),
            status='draft',
            created_by=self.user
        )
    
    def test_campaign_creation(self):
        """Test la création d'une campagne"""
        self.assertEqual(Campaign.objects.count(), 1)
        self.assertEqual(self.campaign.name, 'Test Campaign')
        self.assertEqual(self.campaign.status, 'draft')
        self.assertEqual(self.campaign.created_by, self.user)
    
    def test_campaign_str_representation(self):
        """Test la représentation en chaîne d'une campagne"""
        expected_str = "Test Campaign"
        self.assertEqual(str(self.campaign), expected_str)
    
    def test_campaign_progress_calculation(self):
        """Test le calcul de la progression d'une campagne"""
        # Créer des utilisateurs et des accès
        user1 = User.objects.create_user(
            username='user1@example.com',
            email='user1@example.com',
            password='password123',
            user_id='USER001'
        )
        
        access1 = Access.objects.create(
            access_id='ACCESS001',
            user=user1,
            resource_name='Test Resource',
            resource_type='Application',
            access_level='Read',
            granted_date=timezone.now().date()
        )
        
        access2 = Access.objects.create(
            access_id='ACCESS002',
            user=user1,
            resource_name='Test Resource 2',
            resource_type='Database',
            access_level='Write',
            granted_date=timezone.now().date()
        )
        
        # Créer des revues
        Review.objects.create(
            campaign=self.campaign,
            access=access1,
            reviewer=self.user,
            decision='approved'
        )
        
        Review.objects.create(
            campaign=self.campaign,
            access=access2,
            reviewer=self.user,
            decision='pending'
        )
        
        # Vérifier la progression
        # 1 revue sur 2 est complétée, donc 50%
        self.assertEqual(self.campaign.progress, 50)

class CampaignScopeModelTests(TestCase):
    """Tests pour le modèle CampaignScope"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='password123',
            user_id='ADMIN001',
            role='admin'
        )
        
        self.campaign = Campaign.objects.create(
            name='Test Campaign',
            description='A test campaign',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + datetime.timedelta(days=7),
            status='draft',
            created_by=self.user
        )
        
        self.scope = CampaignScope.objects.create(
            campaign=self.campaign,
            scope_type='department',
            scope_value='IT'
        )
    
    def test_scope_creation(self):
        """Test la création d'un périmètre de campagne"""
        self.assertEqual(CampaignScope.objects.count(), 1)
        self.assertEqual(self.scope.scope_type, 'department')
        self.assertEqual(self.scope.scope_value, 'IT')
        self.assertEqual(self.scope.campaign, self.campaign)
    
    def test_scope_str_representation(self):
        """Test la représentation en chaîne d'un périmètre"""
        expected_str = "Test Campaign - department:IT"
        self.assertEqual(str(self.scope), expected_str)
    
    def test_campaign_scope_relationship(self):
        """Test la relation campagne-périmètre"""
        scope2 = CampaignScope.objects.create(
            campaign=self.campaign,
            scope_type='resource_type',
            scope_value='Application'
        )
        
        scopes = self.campaign.scopes.all()
        self.assertEqual(scopes.count(), 2)
        self.assertIn(self.scope, scopes)
        self.assertIn(scope2, scopes)

class CampaignServiceTests(TestCase):
    """Tests pour le service CampaignService"""
    
    def setUp(self):
        # Créer des utilisateurs
        self.admin = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='password123',
            user_id='ADMIN001',
            role='admin',
            is_staff=True
        )
        
        self.user1 = User.objects.create_user(
            username='user1@example.com',
            email='user1@example.com',
            password='password123',
            user_id='USER001',
            department='IT'
        )
        
        self.user2 = User.objects.create_user(
            username='user2@example.com',
            email='user2@example.com',
            password='password123',
            user_id='USER002',
            department='Finance'
        )
        
        # Créer une campagne
        self.campaign = Campaign.objects.create(
            name='Test Campaign',
            description='A test campaign',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + datetime.timedelta(days=7),
            status='draft',
            created_by=self.admin
        )
        
        # Ajouter des périmètres
        CampaignScope.objects.create(
            campaign=self.campaign,
            scope_type='department',
            scope_value='IT'
        )
        
        # Créer des accès
        self.access1 = Access.objects.create(
            access_id='ACCESS001',
            user=self.user1,
            resource_name='Test Resource',
            resource_type='Application',
            access_level='Read',
            granted_date=timezone.now().date()
        )
        
        self.access2 = Access.objects.create(
            access_id='ACCESS002',
            user=self.user1,
            resource_name='Test Resource 2',
            resource_type='Database',
            access_level='Write',
            granted_date=timezone.now().date()
        )
        
        self.access3 = Access.objects.create(
            access_id='ACCESS003',
            user=self.user2,
            resource_name='Test Resource 3',
            resource_type='Application',
            access_level='Read',
            granted_date=timezone.now().date()
        )
    
    def test_start_campaign(self):
        """Test le démarrage d'une campagne"""
        success, message = CampaignService.start_campaign(self.campaign.id)
        
        # Vérifier que la campagne a été démarrée
        self.assertTrue(success)
        
        # Vérifier que le statut a été mis à jour
        self.campaign.refresh_from_db()
        self.assertEqual(self.campaign.status, 'active')
        
        # Vérifier que les revues ont été créées
        reviews = Review.objects.filter(campaign=self.campaign)
        
        # Seul l'accès de user1 (département IT) doit être inclus dans le périmètre
        self.assertEqual(reviews.count(), 2)
        
        # Vérifier les accès inclus
        access_ids = reviews.values_list('access_id', flat=True)
        self.assertIn(self.access1.id, access_ids)
        self.assertIn(self.access2.id, access_ids)
        self.assertNotIn(self.access3.id, access_ids)
    
    def test_complete_campaign(self):
        """Test la complétion d'une campagne"""
        # Démarrer la campagne
        CampaignService.start_campaign(self.campaign.id)
        
        # Compléter toutes les revues
        reviews = Review.objects.filter(campaign=self.campaign)
        for review in reviews:
            review.decision = 'approved'
            review.reviewed_at = timezone.now()
            review.save()
        
        # Compléter la campagne
        success, message = CampaignService.complete_campaign(self.campaign.id)
        
        # Vérifier que la campagne a été complétée
        self.assertTrue(success)
        
        # Vérifier que le statut a été mis à jour
        self.campaign.refresh_from_db()
        self.assertEqual(self.campaign.status, 'completed')
    
    def test_get_campaign_stats(self):
        """Test la récupération des statistiques d'une campagne"""
        # Démarrer la campagne
        CampaignService.start_campaign(self.campaign.id)
        
        # Compléter quelques revues
        reviews = Review.objects.filter(campaign=self.campaign)
        reviews[0].decision = 'approved'
        reviews[0].reviewed_at = timezone.now()
        reviews[0].save()
        
        # Récupérer les statistiques
        stats = CampaignService.get_campaign_stats(self.campaign.id)
        
        # Vérifier les statistiques
        self.assertIsNotNone(stats)
        self.assertEqual(stats['total_reviews'], 2)
        self.assertEqual(stats['by_decision'].get('approved', 0), 1)
        self.assertEqual(stats['by_decision'].get('pending', 0), 1)

class CampaignAPITests(TestCase):
    """Tests pour l'API Campaign"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Créer des utilisateurs
        self.admin = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='password123',
            user_id='ADMIN001',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        
        self.user = User.objects.create_user(
            username='user@example.com',
            email='user@example.com',
            password='password123',
            user_id='USER001',
            role='reviewer',
            department='IT'
        )
        
        # Authentifier le client en tant qu'admin
        self.client.force_authenticate(user=self.admin)
        
        # Créer une campagne
        self.campaign_data = {
            'name': 'Test Campaign',
            'description': 'A test campaign',
            'start_date': timezone.now().date().isoformat(),
            'end_date': (timezone.now().date() + datetime.timedelta(days=7)).isoformat(),
            'status': 'draft'
        }
    
    def test_create_campaign(self):
        """Test la création d'une campagne via l'API"""
        url = reverse('campaign-list')
        response = self.client.post(url, self.campaign_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Campaign.objects.count(), 1)
        self.assertEqual(Campaign.objects.first().name, 'Test Campaign')
        self.assertEqual(Campaign.objects.first().created_by, self.admin)
    
    def test_list_campaigns(self):
        """Test la récupération de la liste des campagnes"""
        # Créer quelques campagnes
        Campaign.objects.create(
            name='Campaign 1',
            description='First campaign',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + datetime.timedelta(days=7),
            status='draft',
            created_by=self.admin
        )
        
        Campaign.objects.create(
            name='Campaign 2',
            description='Second campaign',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + datetime.timedelta(days=14),
            status='active',
            created_by=self.admin
        )
        
        url = reverse('campaign-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_start_campaign_endpoint(self):
        """Test l'endpoint de démarrage de campagne"""
        # Créer une campagne
        campaign = Campaign.objects.create(
            name='Campaign to Start',
            description='Campaign to start',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + datetime.timedelta(days=7),
            status='draft',
            created_by=self.admin
        )
        
        # Ajouter un périmètre
        CampaignScope.objects.create(
            campaign=campaign,
            scope_type='department',
            scope_value='IT'
        )
        
        # Créer un accès
        user1 = User.objects.create_user(
            username='user1@example.com',
            email='user1@example.com',
            password='password123',
            user_id='USER002',
            department='IT'
        )
        
        Access.objects.create(
            access_id='ACCESS001',
            user=user1,
            resource_name='Test Resource',
            resource_type='Application',
            access_level='Read',
            granted_date=timezone.now().date()
        )
        
        # Démarrer la campagne
        url = reverse('campaign-start', args=[campaign.id])
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Vérifier que la campagne a été démarrée
        campaign.refresh_from_db()
        self.assertEqual(campaign.status, 'active')
        
        # Vérifier que des revues ont été créées
        self.assertTrue(Review.objects.filter(campaign=campaign).exists())
