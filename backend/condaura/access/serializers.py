from rest_framework import serializers
from .models import Access, Review
from users.serializers import UserSerializer
from campaigns.serializers import CampaignSerializer

class AccessSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Access
        fields = ['id', 'access_id', 'user', 'user_name', 'resource_name', 
                  'resource_type', 'access_level', 'granted_date', 'last_used',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

class AccessDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Access
        fields = ['id', 'access_id', 'user', 'resource_name', 
                  'resource_type', 'access_level', 'granted_date', 'last_used',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()
    access_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = ['id', 'campaign', 'access', 'access_details', 'reviewer', 'reviewer_name',
                  'decision', 'comment', 'reviewed_at', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_reviewer_name(self, obj):
        return f"{obj.reviewer.first_name} {obj.reviewer.last_name}"
    
    def get_access_details(self, obj):
        return {
            'resource_name': obj.access.resource_name,
            'resource_type': obj.access.resource_type,
            'access_level': obj.access.access_level,
            'user_name': f"{obj.access.user.first_name} {obj.access.user.last_name}"
        }

class ReviewDetailSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)
    access = AccessSerializer(read_only=True)
    campaign = CampaignSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'campaign', 'access', 'reviewer',
                  'decision', 'comment', 'reviewed_at', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['campaign', 'access', 'reviewer', 'decision', 'comment']
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'META'):
            validated_data['ip_address'] = request.META.get('REMOTE_ADDR')
            validated_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
        return super().create(validated_data) 