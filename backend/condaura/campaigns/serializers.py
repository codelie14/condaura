from rest_framework import serializers
from .models import Campaign, CampaignScope
from users.serializers import UserSerializer

class CampaignScopeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignScope
        fields = ['id', 'scope_type', 'scope_value', 'created_at']

class CampaignSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    progress = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Campaign
        fields = ['id', 'name', 'description', 'start_date', 'end_date', 
                  'status', 'created_by', 'created_by_name', 'created_at', 
                  'updated_at', 'reminder_days', 'progress']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        return f"{obj.created_by.first_name} {obj.created_by.last_name}"

class CampaignDetailSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    scopes = CampaignScopeSerializer(many=True, read_only=True)
    progress = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Campaign
        fields = ['id', 'name', 'description', 'start_date', 'end_date', 
                  'status', 'created_by', 'created_at', 'updated_at', 
                  'reminder_days', 'scopes', 'progress']
        read_only_fields = ['created_at', 'updated_at']

class CampaignCreateSerializer(serializers.ModelSerializer):
    department = serializers.CharField(required=False, write_only=True)
    layer = serializers.CharField(required=False, write_only=True)
    profile = serializers.CharField(required=False, write_only=True)
    role = serializers.CharField(required=False, write_only=True)
    reviewers = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True
    )
    assignment_method = serializers.CharField(required=False, write_only=True)
    
    class Meta:
        model = Campaign
        fields = ['name', 'description', 'start_date', 'end_date', 
                  'status', 'reminder_days', 'department', 'layer', 
                  'profile', 'role', 'reviewers', 'assignment_method']
    
    def create(self, validated_data):
        # Extraire les données de scope et reviewers
        department = validated_data.pop('department', None)
        layer = validated_data.pop('layer', None)
        profile = validated_data.pop('profile', None)
        role = validated_data.pop('role', None)
        reviewers = validated_data.pop('reviewers', [])
        assignment_method = validated_data.pop('assignment_method', 'manual')
        
        # Créer la campagne
        campaign = Campaign.objects.create(**validated_data)
        
        # Créer les scopes si présents
        scopes_to_create = []
        if department:
            scopes_to_create.append({
                'campaign': campaign,
                'scope_type': 'department',
                'scope_value': department
            })
        
        if layer:
            scopes_to_create.append({
                'campaign': campaign,
                'scope_type': 'layer',
                'scope_value': layer
            })
        
        if profile:
            scopes_to_create.append({
                'campaign': campaign,
                'scope_type': 'profile',
                'scope_value': profile
            })
            
        if role:
            scopes_to_create.append({
                'campaign': campaign,
                'scope_type': 'role',
                'scope_value': role
            })
        
        # Créer tous les scopes en une seule requête
        if scopes_to_create:
            CampaignScope.objects.bulk_create([
                CampaignScope(**scope_data) for scope_data in scopes_to_create
            ])
        
        return campaign 