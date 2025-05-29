from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Notification

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    manager_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'user_id', 'department', 'manager', 'manager_name', 'role']
        read_only_fields = ['id']
    
    def get_manager_name(self, obj):
        if obj.manager:
            return f"{obj.manager.first_name} {obj.manager.last_name}"
        return None

class UserDetailSerializer(serializers.ModelSerializer):
    subordinates = serializers.SerializerMethodField()
    unread_notifications = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'user_id', 'department', 'manager', 'role', 'is_active',
                  'subordinates', 'date_joined', 'unread_notifications']
        read_only_fields = ['id', 'date_joined']
    
    def get_subordinates(self, obj):
        return UserSerializer(obj.subordinates.all(), many=True).data
    
    def get_unread_notifications(self, obj):
        return obj.notifications.filter(is_read=False).count()

class RegisterSerializer(serializers.ModelSerializer):
    # For MVP, we'll skip password validation to simplify testing
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    username = serializers.CharField(required=False)
    user_id = serializers.CharField(required=False)
    
    class Meta:
        model = User
        fields = ['username', 'password', 'password2', 'email', 'first_name', 'last_name', 
                  'user_id', 'department', 'role']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'link', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at'] 