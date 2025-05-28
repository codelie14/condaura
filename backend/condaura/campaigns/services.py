from django.utils import timezone
from django.db.models import Q, Count
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta

from .models import Campaign, CampaignScope
from access.models import Access, Review
from users.models import User

class CampaignService:
    @staticmethod
    def start_campaign(campaign_id):
        """
        Démarre une campagne de revue en:
        1. Changeant son statut à 'active'
        2. Attribuant les accès à réviser aux réviseurs appropriés
        3. Créant les enregistrements de revue
        """
        try:
            campaign = Campaign.objects.get(id=campaign_id)
            
            # Vérifier si la campagne peut être démarrée
            if campaign.status != 'draft':
                return False, "La campagne n'est pas à l'état brouillon"
            
            # Mise à jour du statut
            campaign.status = 'active'
            campaign.save()
            
            # Récupérer le périmètre de la campagne
            scopes = campaign.scopes.all()
            
            # Construire la requête pour les accès concernés
            access_query = Q()
            
            for scope in scopes:
                if scope.scope_type == 'department':
                    access_query |= Q(user__department=scope.scope_value)
                elif scope.scope_type == 'resource_type':
                    access_query |= Q(resource_type=scope.scope_value)
                elif scope.scope_type == 'access_level':
                    access_query |= Q(access_level=scope.scope_value)
                elif scope.scope_type == 'user':
                    user = User.objects.filter(email=scope.scope_value).first()
                    if user:
                        access_query |= Q(user=user)
            
            # Obtenir les accès concernés
            accesses = Access.objects.filter(access_query)
            
            # Créer les revues pour chaque accès
            reviews_to_create = []
            
            for access in accesses:
                # Par défaut, on assigne au manager de l'utilisateur
                reviewer = access.user.manager
                
                # Si pas de manager, on assigne au créateur de la campagne
                if not reviewer:
                    reviewer = campaign.created_by
                
                # Créer la revue
                review = Review(
                    campaign=campaign,
                    access=access,
                    reviewer=reviewer,
                    decision='pending'
                )
                reviews_to_create.append(review)
            
            # Création en masse des revues
            if reviews_to_create:
                Review.objects.bulk_create(reviews_to_create)
                
            return True, f"Campagne démarrée avec {len(reviews_to_create)} revues créées"
            
        except Campaign.DoesNotExist:
            return False, "Campagne non trouvée"
        except Exception as e:
            return False, str(e)
    
    @staticmethod
    def complete_campaign(campaign_id):
        """
        Termine une campagne de revue en:
        1. Changeant son statut à 'completed'
        2. Mettant à jour la date de fin si nécessaire
        """
        try:
            campaign = Campaign.objects.get(id=campaign_id)
            
            # Vérifier si la campagne peut être terminée
            if campaign.status != 'active':
                return False, "La campagne n'est pas active"
            
            # Vérifier si toutes les revues sont complétées
            pending_reviews = Review.objects.filter(
                campaign=campaign,
                decision='pending'
            ).count()
            
            if pending_reviews > 0:
                return False, f"Il reste {pending_reviews} revues en attente"
            
            # Mise à jour du statut
            campaign.status = 'completed'
            campaign.save()
            
            return True, "Campagne terminée avec succès"
            
        except Campaign.DoesNotExist:
            return False, "Campagne non trouvée"
        except Exception as e:
            return False, str(e)
    
    @staticmethod
    def get_campaign_stats(campaign_id):
        """
        Récupère les statistiques d'une campagne
        """
        try:
            campaign = Campaign.objects.get(id=campaign_id)
            
            # Nombre total de revues
            total_reviews = Review.objects.filter(campaign=campaign).count()
            
            # Répartition par décision
            decision_stats = Review.objects.filter(campaign=campaign).values(
                'decision'
            ).annotate(count=Count('decision'))
            
            # Répartition par type de ressource
            resource_stats = Review.objects.filter(campaign=campaign).values(
                'access__resource_type'
            ).annotate(count=Count('access__resource_type'))
            
            # Répartition par niveau d'accès
            access_level_stats = Review.objects.filter(campaign=campaign).values(
                'access__access_level'
            ).annotate(count=Count('access__access_level'))
            
            # Répartition par département
            department_stats = Review.objects.filter(campaign=campaign).values(
                'access__user__department'
            ).annotate(count=Count('access__user__department'))
            
            # Construire le résultat
            stats = {
                'total_reviews': total_reviews,
                'progress': campaign.progress,
                'by_decision': {item['decision']: item['count'] for item in decision_stats},
                'by_resource_type': {item['access__resource_type']: item['count'] for item in resource_stats},
                'by_access_level': {item['access__access_level']: item['count'] for item in access_level_stats},
                'by_department': {item['access__user__department']: item['count'] for item in department_stats}
            }
            
            return stats
            
        except Campaign.DoesNotExist:
            return None
        except Exception:
            return None
    
    @staticmethod
    def send_reminders(campaign_id=None):
        """
        Envoie des rappels pour les revues en attente
        Si campaign_id est fourni, uniquement pour cette campagne
        Sinon, pour toutes les campagnes actives proches de leur date de fin
        """
        try:
            if campaign_id:
                # Pour une campagne spécifique
                campaigns = Campaign.objects.filter(id=campaign_id, status='active')
            else:
                # Pour toutes les campagnes actives avec date de fin proche
                today = timezone.now().date()
                campaigns = Campaign.objects.filter(
                    status='active',
                    end_date__gte=today,
                    end_date__lte=today + timedelta(days=3)
                )
            
            reminders_sent = 0
            
            for campaign in campaigns:
                # Récupérer les revues en attente
                pending_reviews = Review.objects.filter(
                    campaign=campaign,
                    decision='pending'
                ).select_related('reviewer')
                
                # Regrouper par réviseur
                reviewer_reviews = {}
                for review in pending_reviews:
                    if review.reviewer.id not in reviewer_reviews:
                        reviewer_reviews[review.reviewer.id] = {
                            'reviewer': review.reviewer,
                            'reviews': []
                        }
                    reviewer_reviews[review.reviewer.id]['reviews'].append(review)
                
                # Envoyer les rappels
                for reviewer_id, data in reviewer_reviews.items():
                    reviewer = data['reviewer']
                    reviews_count = len(data['reviews'])
                    
                    # Envoyer l'email
                    if settings.EMAIL_BACKEND:  # Vérifier que l'email est configuré
                        send_mail(
                            f'Rappel: {reviews_count} revues en attente - Campagne {campaign.name}',
                            f'Bonjour {reviewer.first_name},\n\n'
                            f'Vous avez {reviews_count} revues en attente dans la campagne "{campaign.name}".\n'
                            f'La date limite est le {campaign.end_date.strftime("%d/%m/%Y")}.\n\n'
                            f'Veuillez vous connecter pour compléter vos revues : http://localhost:8000/admin/\n\n'
                            f'Cordialement,\n'
                            f'L\'équipe Condaura',
                            settings.DEFAULT_FROM_EMAIL,
                            [reviewer.email],
                            fail_silently=True,
                        )
                        reminders_sent += 1
            
            return True, f"{reminders_sent} rappels envoyés"
            
        except Exception as e:
            return False, str(e) 