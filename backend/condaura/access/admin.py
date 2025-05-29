from django.contrib import admin
from .models import Access, Review

@admin.register(Access)
class AccessAdmin(admin.ModelAdmin):
    list_display = ('access_id', 'user', 'resource_name', 'layer', 'profile', 'granted_date', 'last_used')
    list_filter = ('layer', 'profile', 'granted_date')
    search_fields = ('access_id', 'resource_name', 'user__email', 'user__first_name', 'user__last_name')
    date_hierarchy = 'granted_date'
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (None, {'fields': ('access_id', 'user')}),
        ('Resource', {'fields': ('resource_name', 'layer', 'profile')}),
        ('Dates', {'fields': ('granted_date', 'last_used', 'created_at', 'updated_at')}),
    )

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('access', 'campaign', 'reviewer', 'decision', 'reviewed_at')
    list_filter = ('decision', 'campaign', 'reviewed_at')
    search_fields = ('access__access_id', 'access__resource_name', 'reviewer__email', 'comment')
    date_hierarchy = 'reviewed_at'
    readonly_fields = ('created_at', 'updated_at', 'ip_address', 'user_agent')
    
    fieldsets = (
        (None, {'fields': ('access', 'campaign', 'reviewer')}),
        ('Decision', {'fields': ('decision', 'comment', 'reviewed_at')}),
        ('Audit', {'fields': ('ip_address', 'user_agent', 'created_at', 'updated_at')}),
    )
