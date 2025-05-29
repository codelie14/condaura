from django.shortcuts import render
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
import csv
import io
import pandas as pd

from .models import Access, Review
from .serializers import (
    AccessSerializer,
    AccessDetailSerializer,
    ReviewSerializer,
    ReviewDetailSerializer,
    ReviewCreateSerializer
)
from users.models import User

class AccessViewSet(viewsets.ModelViewSet):
    queryset = Access.objects.all()
    serializer_class = AccessSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['resource_type', 'access_level', 'user__department']
    search_fields = ['resource_name', 'user__first_name', 'user__last_name']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AccessDetailSerializer
        return AccessSerializer
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def import_csv(self, request):
        """Import accesses from CSV file"""
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        csv_file = request.FILES['file']
        if not csv_file.name.endswith('.csv'):
            return Response({'error': 'File is not CSV'}, status=status.HTTP_400_BAD_REQUEST)
        
        decoded_file = csv_file.read().decode('utf-8')
        csv_data = csv.DictReader(io.StringIO(decoded_file))
        
        accesses_created = 0
        errors = []
        
        for row in csv_data:
            try:
                # Check for required fields
                required_fields = ['access_id', 'user_id', 'resource_name', 'resource_type', 'access_level']
                missing_fields = [field for field in required_fields if field not in row or not row[field]]
                
                if missing_fields:
                    errors.append(f"Row missing required fields: {', '.join(missing_fields)}")
                    continue
                
                # Check if access already exists
                if Access.objects.filter(access_id=row['access_id']).exists():
                    errors.append(f"Access with ID {row['access_id']} already exists")
                    continue
                
                # Find user
                try:
                    user = User.objects.get(user_id=row['user_id'])
                except User.DoesNotExist:
                    errors.append(f"User with ID {row['user_id']} not found")
                    continue
                
                # Parse dates
                granted_date = row.get('granted_date')
                last_used = row.get('last_used')
                
                # Create access
                Access.objects.create(
                    access_id=row['access_id'],
                    user=user,
                    resource_name=row['resource_name'],
                    resource_type=row['resource_type'],
                    access_level=row['access_level'],
                    granted_date=granted_date,
                    last_used=last_used if last_used else None
                )
                
                accesses_created += 1
                
            except Exception as e:
                errors.append(f"Error processing row: {str(e)}")
        
        return Response({
            'accesses_created': accesses_created,
            'errors': errors
        }, status=status.HTTP_200_OK)

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['decision', 'campaign', 'reviewer']
    search_fields = ['access__resource_name', 'comment']
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin users can see all reviews
        if user.is_staff or user.role == 'admin':
            queryset = Review.objects.all()
        else:
            # Reviewers can only see their assigned reviews
            queryset = Review.objects.filter(reviewer=user)
        
        # Handle decision filter case-insensitive
        decision = self.request.query_params.get('decision', None)
        if decision:
            if decision.lower() == 'pending':
                queryset = queryset.filter(decision='pending')
            elif decision.lower() == 'approved':
                queryset = queryset.filter(decision='approved')
            elif decision.lower() == 'rejected':
                queryset = queryset.filter(decision='rejected')
            elif decision.lower() == 'deferred':
                queryset = queryset.filter(decision='deferred')
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ReviewDetailSerializer
        elif self.action == 'create' or self.action == 'update':
            return ReviewCreateSerializer
        return ReviewSerializer
    
    def perform_update(self, serializer):
        # Set reviewed_at timestamp when decision is updated
        if 'decision' in self.request.data and self.request.data['decision'] != 'pending':
            serializer.save(
                reviewed_at=timezone.now(),
                ip_address=self.request.META.get('REMOTE_ADDR'),
                user_agent=self.request.META.get('HTTP_USER_AGENT', '')
            )
        else:
            serializer.save()
    
    @action(detail=False, methods=['get'])
    def my_reviews(self, request):
        """Get reviews assigned to the current user"""
        user = request.user
        reviews = Review.objects.filter(reviewer=user)
        
        # Filter by campaign if provided
        campaign_id = request.query_params.get('campaign')
        if campaign_id:
            reviews = reviews.filter(campaign_id=campaign_id)
        
        # Filter by decision if provided
        decision = request.query_params.get('decision')
        if decision:
            reviews = reviews.filter(decision=decision)
        
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get review statistics"""
        user = request.user
        
        # Filter by campaign if provided
        campaign_id = request.query_params.get('campaign')
        campaign_filter = Q(campaign_id=campaign_id) if campaign_id else Q()
        
        # For admin users, show all stats
        if user.is_staff or user.role == 'admin':
            reviews = Review.objects.filter(campaign_filter)
        else:
            # For regular users, only show their reviews
            reviews = Review.objects.filter(campaign_filter, reviewer=user)
        
        # Count by decision
        decision_counts = reviews.values('decision').annotate(count=pd.value_counts('decision'))
        
        # Count by resource type
        resource_counts = reviews.values('access__resource_type').annotate(count=pd.value_counts('access__resource_type'))
        
        return Response({
            'total': reviews.count(),
            'by_decision': decision_counts,
            'by_resource_type': resource_counts
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def bulk_approve(self, request):
        """Approve multiple reviews at once"""
        review_ids = request.data.get('review_ids', [])
        if not review_ids:
            return Response({'error': 'No review IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        reviews = Review.objects.filter(id__in=review_ids, reviewer=user)
        
        updated_count = reviews.update(
            decision='approved',
            reviewed_at=timezone.now(),
            comment=request.data.get('comment', 'Bulk approval')
        )
        
        return Response({
            'updated_count': updated_count
        }, status=status.HTTP_200_OK)
