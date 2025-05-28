from django.contrib import admin
from .models import Campaign, CampaignScope

class CampaignScopeInline(admin.TabularInline):
    model = CampaignScope
    extra = 1

@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'start_date', 'end_date', 'created_by', 'progress')
    list_filter = ('status', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at', 'progress')
    inlines = [CampaignScopeInline]
    
    fieldsets = (
        (None, {'fields': ('name', 'description', 'status')}),
        ('Timeline', {'fields': ('start_date', 'end_date', 'reminder_days')}),
        ('Details', {'fields': ('created_by', 'created_at', 'updated_at', 'progress')}),
    )

@admin.register(CampaignScope)
class CampaignScopeAdmin(admin.ModelAdmin):
    list_display = ('campaign', 'scope_type', 'scope_value')
    list_filter = ('scope_type', 'campaign')
    search_fields = ('scope_value', 'campaign__name')
