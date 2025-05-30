from django.db import models
from users.models import User

class Campaign(models.Model):
    RECURRENCE_FREQUENCY_CHOICES = (
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    )

    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_campaigns')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reminder_days = models.PositiveIntegerField(default=3, help_text="Days before deadline to send reminders")
    
    # Champs pour la récurrence
    is_recurring = models.BooleanField(default=False)
    # Utilise RECURRENCE_FREQUENCY_CHOICES qui est maintenant défini au sein de la classe
    recurrence_frequency = models.CharField(max_length=10, choices=RECURRENCE_FREQUENCY_CHOICES, null=True, blank=True)
    recurrence_interval = models.PositiveIntegerField(default=1, null=True, blank=True, help_text="Interval for the frequency (e.g., every 2 months if frequency is monthly and interval is 2)")
    next_occurrence_date = models.DateField(null=True, blank=True, help_text="Next scheduled date for recurring campaign")

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = 'Campaign'
        verbose_name_plural = 'Campaigns'
        ordering = ['-start_date']
    
    @property
    def is_active(self):
        return self.status == 'active'
    
    @property
    def progress(self):
        """Calculate campaign progress percentage"""
        from access.models import Review
        total_reviews = self.reviews.count()
        if total_reviews == 0:
            return 0
        completed_reviews = self.reviews.exclude(decision='pending').count()
        return int((completed_reviews / total_reviews) * 100)

class CampaignScope(models.Model):
    """Define the scope of a campaign (which departments, resources, etc.)"""
    SCOPE_TYPE_CHOICES = (
        ('department', 'Department'),
        ('layer', 'Layer'),
        ('profile', 'Profile'),
        ('user', 'Specific User'),
        ('role', 'Role'),
    )
    
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='scopes')
    scope_type = models.CharField(max_length=20, choices=SCOPE_TYPE_CHOICES)
    scope_value = models.CharField(max_length=200, help_text="Value for the scope (department name, resource type, etc.)")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.campaign.name} - {self.scope_type}: {self.scope_value}"
    
    class Meta:
        verbose_name = 'Campaign Scope'
        verbose_name_plural = 'Campaign Scopes'
        unique_together = ('campaign', 'scope_type', 'scope_value')
