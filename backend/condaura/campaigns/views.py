from django.shortcuts import render
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q
from django.http import Http404

from .models import Campaign, CampaignScope
from .serializers import (
    CampaignSerializer, 
    CampaignDetailSerializer,
    CampaignCreateSerializer,
    CampaignScopeSerializer
)
from access.models import Access, Review
from .services import CampaignService
from .reports import ReportGenerator

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin users to create/edit campaigns.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write permissions are only allowed to admin users
        return request.user.is_staff or request.user.role == 'admin'

class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'created_by']
    search_fields = ['name', 'description']
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin users can see all campaigns
        if user.is_staff or user.role == 'admin':
            return Campaign.objects.all()
        
        # Reviewers can only see campaigns they are involved in
        return Campaign.objects.filter(
            id__in=Review.objects.filter(reviewer=user).values_list('campaign_id', flat=True).distinct()
        )
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CampaignDetailSerializer
        elif self.action == 'create':
            return CampaignCreateSerializer
        return CampaignSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def start(self, request, pk=None):
        """Démarre une campagne de revue"""
        success, message = CampaignService.start_campaign(pk)
        
        if success:
            return Response({'message': message}, status=status.HTTP_200_OK)
        else:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def complete(self, request, pk=None):
        """Termine une campagne de revue"""
        success, message = CampaignService.complete_campaign(pk)
        
        if success:
            return Response({'message': message}, status=status.HTTP_200_OK)
        else:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Récupère les statistiques d'une campagne"""
        stats = CampaignService.get_campaign_stats(pk)
        
        if stats:
            return Response(stats, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Campagne non trouvée ou erreur de calcul des statistiques'}, 
                           status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def send_reminders(self, request, pk=None):
        """Envoie des rappels pour les revues en attente de cette campagne"""
        success, message = CampaignService.send_reminders(pk)
        
        if success:
            return Response({'message': message}, status=status.HTTP_200_OK)
        else:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def export_excel(self, request, pk=None):
        """Exporte les données de la campagne au format Excel"""
        response = ReportGenerator.generate_excel_report(pk)
        
        if response:
            return response
        else:
            return Response({'error': 'Erreur lors de la génération du rapport Excel'}, 
                           status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        """Exporte les données de la campagne au format PDF"""
        response = ReportGenerator.generate_pdf_report(pk)
        
        if response:
            return response
        else:
            return Response({'error': 'Erreur lors de la génération du rapport PDF'}, 
                           status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def export_csv(self, request, pk=None):
        """Exporte les données de la campagne au format CSV"""
        response = ReportGenerator.generate_csv_report(pk)
        
        if response:
            return response
        else:
            return Response({'error': 'Erreur lors de la génération du rapport CSV'}, 
                           status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a campaign"""
        campaign = self.get_object()
        
        if campaign.status != 'draft':
            return Response({'error': 'Only draft campaigns can be activated'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Update campaign status
        campaign.status = 'active'
        campaign.save()
        
        return Response({
            'status': 'Campaign activated'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard statistics"""
        user = request.user
        
        # Count campaigns by status
        campaign_stats = {
            'total': Campaign.objects.count(),
            'active': Campaign.objects.filter(status='active').count(),
            'completed': Campaign.objects.filter(status='completed').count(),
            'draft': Campaign.objects.filter(status='draft').count(),
        }
        
        # Count reviews by decision for current user
        review_stats = {}
        if user.role == 'admin' or user.is_staff:
            # Admin sees all reviews
            review_stats = {
                'total': Review.objects.count(),
                'approved': Review.objects.filter(decision='approved').count(),
                'rejected': Review.objects.filter(decision='rejected').count(),
                'pending': Review.objects.filter(decision='pending').count(),
            }
        else:
            # Regular users see only their reviews
            review_stats = {
                'total': Review.objects.filter(reviewer=user).count(),
                'approved': Review.objects.filter(reviewer=user, decision='approved').count(),
                'rejected': Review.objects.filter(reviewer=user, decision='rejected').count(),
                'pending': Review.objects.filter(reviewer=user, decision='pending').count(),
            }
        
        return Response({
            'campaign_stats': campaign_stats,
            'review_stats': review_stats
        }, status=status.HTTP_200_OK)

class CampaignScopeViewSet(viewsets.ModelViewSet):
    queryset = CampaignScope.objects.all()
    serializer_class = CampaignScopeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['campaign', 'scope_type']
