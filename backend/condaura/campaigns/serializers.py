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
    scopes = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        ),
        required=False
    )
    
    class Meta:
        model = Campaign
        fields = ['name', 'description', 'start_date', 'end_date', 
                  'status', 'reminder_days', 'scopes']
    
    def create(self, validated_data):
        scopes_data = validated_data.pop('scopes', [])
        campaign = Campaign.objects.create(**validated_data)
        
        for scope_data in scopes_data:
            CampaignScope.objects.create(
                campaign=campaign,
                scope_type=scope_data.get('scope_type'),
                scope_value=scope_data.get('scope_value')
            )
        
        return campaign 