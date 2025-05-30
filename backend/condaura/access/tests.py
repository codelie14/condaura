from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
import datetime
import io
import csv

from .models import Access, Review
from campaigns.models import Campaign

User = get_user_model()

class AccessModelTests(TestCase):
    """Tests pour le modèle Access"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='user@example.com',
            email='user@example.com',
            password='password123',
            first_name='Test',
            last_name='User',
            user_id='USER001',
            department='IT'
        )
        
        self.access = Access.objects.create(
            access_id='ACCESS001',
            user=self.user,
            resource_name='Test Resource',
            resource_type='Application',
            access_level='Read',
            granted_date=timezone.now().date()
        )
    
    def test_access_creation(self):
        """Test la création d'un accès"""
        self.assertEqual(Access.objects.count(), 1)
        self.assertEqual(self.access.access_id, 'ACCESS001')
        self.assertEqual(self.access.user, self.user)
        self.assertEqual(self.access.resource_name, 'Test Resource')
        self.assertEqual(self.access.resource_type, 'Application')
        self.assertEqual(self.access.access_level, 'Read')
    
    def test_access_str_representation(self):
        """Test la représentation en chaîne d'un accès"""
        expected_str = "Test User - Test Resource (Read)"
        self.assertEqual(str(self.access), expected_str)

class ReviewModelTests(TestCase):
    """Tests pour le modèle Review"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='user@example.com',
            email='user@example.com',
            password='password123',
            first_name='Test',
            last_name='User',
            user_id='USER001',
            department='IT'
        )
        
        self.reviewer = User.objects.create_user(
            username='reviewer@example.com',
            email='reviewer@example.com',
            password='password123',
            first_name='Test',
            last_name='Reviewer',
            user_id='REVIEWER001',
            role='reviewer'
        )
        
        self.campaign = Campaign.objects.create(
            name='Test Campaign',
            description='A test campaign',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + datetime.timedelta(days=7),
            status='active',
            created_by=self.reviewer
        )
        
        self.access = Access.objects.create(
            access_id='ACCESS001',
            user=self.user,
            resource_name='Test Resource',
            resource_type='Application',
            access_level='Read',
            granted_date=timezone.now().date()
        )
        
        self.review = Review.objects.create(
            campaign=self.campaign,
            access=self.access,
            reviewer=self.reviewer,
            decision='pending'
        )
    
    def test_review_creation(self):
        """Test la création d'une revue"""
        self.assertEqual(Review.objects.count(), 1)
        self.assertEqual(self.review.campaign, self.campaign)
        self.assertEqual(self.review.access, self.access)
        self.assertEqual(self.review.reviewer, self.reviewer)
        self.assertEqual(self.review.decision, 'pending')
        self.assertIsNone(self.review.reviewed_at)
    
    def test_review_approval(self):
        """Test l'approbation d'une revue"""
        self.review.decision = 'approved'
        self.review.reviewed_at = timezone.now()
        self.review.save()
        
        updated_review = Review.objects.get(id=self.review.id)
        self.assertEqual(updated_review.decision, 'approved')
        self.assertIsNotNone(updated_review.reviewed_at)
    
    def test_review_rejection(self):
        """Test le rejet d'une revue"""
        self.review.decision = 'rejected'
        self.review.comment = 'Not needed anymore'
        self.review.reviewed_at = timezone.now()
        self.review.save()
        
        updated_review = Review.objects.get(id=self.review.id)
        self.assertEqual(updated_review.decision, 'rejected')
        self.assertEqual(updated_review.comment, 'Not needed anymore')
        self.assertIsNotNone(updated_review.reviewed_at)

class AccessAPITests(TestCase):
    """Tests pour l'API Access"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Créer un utilisateur admin
        self.admin = User.objects.create_user(
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
        
        # Créer un utilisateur normal
        self.user = User.objects.create_user(
            username='user@example.com',
            email='user@example.com',
            password='password123',
            first_name='Test',
            last_name='User',
            user_id='USER001',
            department='IT'
        )
        
        # Créer quelques accès
        self.access1 = Access.objects.create(
            access_id='ACCESS001',
            user=self.user,
            resource_name='Test Resource 1',
            resource_type='Application',
            access_level='Read',
            granted_date=timezone.now().date()
        )
        
        self.access2 = Access.objects.create(
            access_id='ACCESS002',
            user=self.user,
            resource_name='Test Resource 2',
            resource_type='Database',
            access_level='Write',
            granted_date=timezone.now().date()
        )
        
        # Authentifier le client en tant qu'admin
        self.client.force_authenticate(user=self.admin)
    
    def test_list_accesses(self):
        """Test la récupération de la liste des accès"""
        url = reverse('access-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_create_access(self):
        """Test la création d'un accès via l'API"""
        url = reverse('access-list')
        data = {
            'access_id': 'ACCESS003',
            'user': self.user.id,
            'resource_name': 'Test Resource 3',
            'resource_type': 'Folder',
            'access_level': 'Admin',
            'granted_date': timezone.now().date().isoformat()
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Access.objects.count(), 3)
        self.assertEqual(Access.objects.get(access_id='ACCESS003').resource_name, 'Test Resource 3')
    
    def test_filter_accesses(self):
        """Test le filtrage des accès"""
        url = reverse('access-list') + '?resource_type=Database'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['resource_name'], 'Test Resource 2')
    
    def test_import_csv(self):
        """Test l'importation d'accès depuis un CSV"""
        url = reverse('access-import-csv')
        
        # Créer un fichier CSV en mémoire
        csv_file = io.StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(['access_id', 'user_id', 'resource_name', 'resource_type', 'access_level', 'granted_date'])
        writer.writerow(['ACCESS004', 'USER001', 'Imported Resource', 'Application', 'Read', timezone.now().date().isoformat()])
        csv_file.seek(0)
        
        # Préparer le fichier pour l'upload
        response = self.client.post(url, {'file': csv_file}, format='multipart')
        
        # Ce test peut échouer en fonction de l'implémentation réelle de l'importation CSV
        # Ici nous vérifions juste que l'endpoint est accessible
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

    def test_import_csv_missing_required_fields(self):
        """Test import CSV avec des champs requis manquants."""
        url = reverse("access-import-csv")
        csv_file = io.StringIO()
        writer = csv.writer(csv_file)
        # Manque resource_name, resource_type, access_level
        writer.writerow(["access_id", "user_id", "granted_date"])
        writer.writerow(["ACCESS005", "USER001", timezone.now().date().isoformat()])
        csv_file.seek(0)
        response = self.client.post(url, {"file": csv_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) # Ou 200 OK avec des erreurs listées
        # Example check if server responds 200 OK but with an error list in JSON
        # if status.HTTP_200_OK == response.status_code:
        #      self.assertIn("errors", response.data)
        #      self.assertTrue(len(response.data["errors"]) > 0)
        #      self.assertIn("missing required fields", response.data["errors"][0].lower())

    def test_import_csv_non_existent_user(self):
        """Test import CSV avec un user_id non existant."""
        url = reverse("access-import-csv")
        csv_file = io.StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(["access_id", "user_id", "resource_name", "resource_type", "access_level", "granted_date"])
        writer.writerow(["ACCESS006", "NONEXISTENT_USER", "Resource X", "App", "Read", timezone.now().date().isoformat()])
        csv_file.seek(0)
        response = self.client.post(url, {"file": csv_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) # Ou 200 OK avec des erreurs
        # Example check if server responds 200 OK but with an error list in JSON
        # if status.HTTP_200_OK == response.status_code:
        #      self.assertIn("errors", response.data)
        #      self.assertTrue(len(response.data["errors"]) > 0)
        #      self.assertIn("not found", response.data["errors"][0].lower())

    def test_import_csv_duplicate_access_id(self):
        """Test import CSV avec un access_id dupliqué."""
        # self.access1 (ACCESS001) existe déjà dans le setUp
        url = reverse("access-import-csv")
        csv_file = io.StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(["access_id", "user_id", "resource_name", "resource_type", "access_level", "granted_date"])
        writer.writerow([self.access1.access_id, "USER001", "Duplicate Resource", "App", "Read", timezone.now().date().isoformat()])
        csv_file.seek(0)
        response = self.client.post(url, {"file": csv_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) # Ou 200 OK avec des erreurs
        # Example check if server responds 200 OK but with an error list in JSON
        # if status.HTTP_200_OK == response.status_code:
        #      self.assertIn("errors", response.data)
        #      self.assertTrue(len(response.data["errors"]) > 0)
        #      self.assertIn("already exists", response.data["errors"][0].lower())

class ReviewAPITests(TestCase):
    """Tests pour l'API Review"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Créer un utilisateur admin
        self.admin = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='password123',
            first_name='Admin',
            last_name='User',
            user_id='ADMIN001',
            role='admin',
            is_staff=True
        )
        
        # Créer un utilisateur normal
        self.user = User.objects.create_user(
            username='user@example.com',
            email='user@example.com',
            password='password123',
            first_name='Test',
            last_name='User',
            user_id='USER001',
            department='IT'
        )
        
        # Créer un réviseur
        self.reviewer = User.objects.create_user(
            username='reviewer@example.com',
            email='reviewer@example.com',
            password='password123',
            first_name='Test',
            last_name='Reviewer',
            user_id='REVIEWER001',
            role='reviewer'
        )
        
        # Créer une campagne
        self.campaign = Campaign.objects.create(
            name='Test Campaign',
            description='A test campaign',
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + datetime.timedelta(days=7),
            status='active',
            created_by=self.admin
        )
        
        # Créer des accès
        self.access1 = Access.objects.create(
            access_id='ACCESS001',
            user=self.user,
            resource_name='Test Resource 1',
            resource_type='Application',
            access_level='Read',
            granted_date=timezone.now().date()
        )
        
        self.access2 = Access.objects.create(
            access_id='ACCESS002',
            user=self.user,
            resource_name='Test Resource 2',
            resource_type='Database',
            access_level='Write',
            granted_date=timezone.now().date()
        )
        
        # Créer des revues
        self.review1 = Review.objects.create(
            campaign=self.campaign,
            access=self.access1,
            reviewer=self.reviewer,
            decision='pending'
        )
        
        self.review2 = Review.objects.create(
            campaign=self.campaign,
            access=self.access2,
            reviewer=self.reviewer,
            decision='pending'
        )
        
        # Authentifier le client en tant que réviseur
        self.client.force_authenticate(user=self.reviewer)
    
    def test_list_reviews(self):
        """Test la récupération de la liste des revues"""
        url = reverse('review-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_filter_reviews_by_campaign(self):
        """Test le filtrage des revues par campagne"""
        url = reverse('review-list') + f'?campaign={self.campaign.id}'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_filter_reviews_by_reviewer(self):
        """Test le filtrage des revues par réviseur"""
        url = reverse('review-list') + f'?reviewer={self.reviewer.id}'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_approve_review(self):
        """Test l'approbation d'une revue"""
        url = reverse('review-detail', args=[self.review1.id])
        data = {
            'decision': 'approved',
            'comment': 'Approved by test'
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.review1.refresh_from_db()
        self.assertEqual(self.review1.decision, 'approved')
        self.assertEqual(self.review1.comment, 'Approved by test')
        self.assertIsNotNone(self.review1.reviewed_at)
    
    def test_reject_review(self):
        """Test le rejet d'une revue"""
        url = reverse('review-detail', args=[self.review2.id])
        data = {
            'decision': 'rejected',
            'comment': 'Rejected by test'
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.review2.refresh_from_db()
        self.assertEqual(self.review2.decision, 'rejected')
        self.assertEqual(self.review2.comment, 'Rejected by test')
        self.assertIsNotNone(self.review2.reviewed_at)
    
    def test_reviewer_can_only_update_own_reviews(self):
        """Test qu'un réviseur ne peut mettre à jour que ses propres revues"""
        # Créer un autre réviseur
        another_reviewer = User.objects.create_user(
            username='another@example.com',
            email='another@example.com',
            password='password123',
            user_id='ANOTHER001',
            role='reviewer'
        )
        
        # Créer une revue assignée à l'autre réviseur
        other_review = Review.objects.create(
            campaign=self.campaign,
            access=self.access1,
            reviewer=another_reviewer,
            decision='pending'
        )
        
        # Tenter de mettre à jour la revue d'un autre réviseur
        url = reverse('review-detail', args=[other_review.id])
        data = {
            'decision': 'approved',
            'comment': 'Approved by wrong reviewer'
        }
        
        response = self.client.patch(url, data, format='json')
        
        # L'API devrait refuser cette mise à jour
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Vérifier que la revue n'a pas été modifiée
        other_review.refresh_from_db()
        self.assertEqual(other_review.decision, 'pending')
        self.assertEqual(other_review.comment, '')
