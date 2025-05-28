from django.utils import timezone
from django.db.models import Q
from django.core.mail import send_mail
from django.conf import settings

from .models import User, Notification

class NotificationService:
    @staticmethod
    def create_notification(user_id, notification_type, title, message, link='', send_email=False):
        """
        Crée une notification pour un utilisateur
        Peut également envoyer un email si send_email=True
        """
        try:
            user = User.objects.get(id=user_id)
            
            notification = Notification.objects.create(
                user=user,
                type=notification_type,
                title=title,
                message=message,
                link=link
            )
            
            # Envoyer un email si demandé
            if send_email and settings.EMAIL_BACKEND:
                send_mail(
                    title,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=True,
                )
            
            return notification
        except User.DoesNotExist:
            return None
        except Exception:
            return None
    
    @staticmethod
    def create_campaign_notifications(campaign, notification_type, title, message, link='', send_email=False):
        """
        Crée des notifications pour tous les réviseurs d'une campagne
        """
        from access.models import Review  # Import ici pour éviter les imports circulaires
        
        try:
            # Récupérer tous les réviseurs uniques de la campagne
            reviewer_ids = Review.objects.filter(
                campaign=campaign
            ).values_list('reviewer_id', flat=True).distinct()
            
            notifications = []
            
            for reviewer_id in reviewer_ids:
                notification = NotificationService.create_notification(
                    reviewer_id, 
                    notification_type, 
                    title, 
                    message, 
                    link, 
                    send_email
                )
                if notification:
                    notifications.append(notification)
            
            return notifications
        except Exception:
            return []
    
    @staticmethod
    def mark_as_read(notification_id):
        """
        Marque une notification comme lue
        """
        try:
            notification = Notification.objects.get(id=notification_id)
            notification.is_read = True
            notification.save()
            return True
        except Notification.DoesNotExist:
            return False
    
    @staticmethod
    def mark_all_as_read(user_id):
        """
        Marque toutes les notifications d'un utilisateur comme lues
        """
        try:
            Notification.objects.filter(user_id=user_id, is_read=False).update(is_read=True)
            return True
        except Exception:
            return False
    
    @staticmethod
    def get_unread_count(user_id):
        """
        Récupère le nombre de notifications non lues pour un utilisateur
        """
        try:
            return Notification.objects.filter(user_id=user_id, is_read=False).count()
        except Exception:
            return 0 