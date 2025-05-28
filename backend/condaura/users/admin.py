from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Notification

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('user_id', 'email', 'first_name', 'last_name', 'department', 'role', 'is_active')
    list_filter = ('role', 'department', 'is_active')
    search_fields = ('user_id', 'email', 'first_name', 'last_name')
    ordering = ('last_name', 'first_name')
    
    fieldsets = (
        (None, {'fields': ('user_id', 'username', 'email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'department', 'manager')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'created_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('user_id', 'email', 'username', 'password1', 'password2', 'role', 'department'),
        }),
    )
    
    readonly_fields = ('created_at',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'title', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'created_at')
    search_fields = ('title', 'message', 'user__email', 'user__first_name', 'user__last_name')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at',)
    
    fieldsets = (
        (None, {'fields': ('user', 'type', 'title', 'is_read')}),
        ('Content', {'fields': ('message', 'link')}),
        ('Dates', {'fields': ('created_at',)}),
    )
