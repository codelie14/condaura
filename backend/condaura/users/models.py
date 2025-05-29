from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('back_office', 'Back office'),
        ('front_office', 'Front office'),
        ('dao', 'DAO'),
        ('digital_team', 'Digital Team'),
    )
    
    user_id = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=100, blank=True)
    manager = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='subordinates')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='back_office')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['last_name', 'first_name']

class Notification(models.Model):
    TYPE_CHOICES = (
        ('review_assigned', 'Revue assignée'),
        ('campaign_started', 'Campagne démarrée'),
        ('campaign_completed', 'Campagne terminée'),
        ('review_pending', 'Revue en attente'),
        ('review_completed', 'Revue complétée'),
        ('reminder', 'Rappel'),
        ('system', 'Système'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} ({self.user.email})"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
