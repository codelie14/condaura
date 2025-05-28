from django.db import models
from users.models import User

class Access(models.Model):
    access_id = models.CharField(max_length=50, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accesses')
    resource_name = models.CharField(max_length=200)
    resource_type = models.CharField(max_length=50)
    access_level = models.CharField(max_length=50)
    granted_date = models.DateField()
    last_used = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.resource_name} ({self.access_level})"
    
    class Meta:
        verbose_name = 'Access'
        verbose_name_plural = 'Accesses'
        ordering = ['-granted_date']

class Review(models.Model):
    DECISION_CHOICES = (
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('pending', 'Pending'),
        ('deferred', 'Deferred'),
    )
    
    campaign = models.ForeignKey('campaigns.Campaign', on_delete=models.CASCADE, related_name='reviews')
    access = models.ForeignKey(Access, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    decision = models.CharField(max_length=20, choices=DECISION_CHOICES, default='pending')
    comment = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.access} - {self.decision}"
    
    class Meta:
        verbose_name = 'Review'
        verbose_name_plural = 'Reviews'
        ordering = ['-reviewed_at', '-created_at']
