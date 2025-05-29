from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from campaigns.views import CampaignViewSet
from access.views import ReviewViewSet

# Create a router for campaigns
campaign_router = DefaultRouter()
campaign_router.register(r'campaigns', CampaignViewSet, basename='campaign')

# Create a router for reviews
review_router = DefaultRouter()
review_router.register(r'reviews', ReviewViewSet, basename='review')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def campaign_list(request):
    """Return campaigns in a format expected by the frontend"""
    # Get the user
    user = request.user
    
    # Get campaigns based on user role
    if user.is_staff or user.role == 'admin':
        from campaigns.models import Campaign
        campaigns = Campaign.objects.all()
    else:
        from campaigns.models import Campaign
        from access.models import Review
        # Get campaigns where user is a reviewer
        campaign_ids = Review.objects.filter(reviewer=user).values_list('campaign_id', flat=True).distinct()
        campaigns = Campaign.objects.filter(id__in=campaign_ids)
    
    # Format the response as expected by frontend
    from campaigns.serializers import CampaignSerializer
    serializer = CampaignSerializer(campaigns, many=True)
    
    # If no campaigns, return an empty array with proper structure
    if not campaigns:
        # Create a dummy campaign to get the structure
        return Response([])
    
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def review_list(request):
    """Return reviews in a format expected by the frontend"""
    # Get the user
    user = request.user
    
    # Get reviews based on user role
    from access.models import Review
    if user.is_staff or user.role == 'admin':
        reviews = Review.objects.all()
    else:
        reviews = Review.objects.filter(reviewer=user)
    
    # Filter by decision if provided
    decision = request.query_params.get('decision')
    if decision:
        if decision.lower() == 'pending':
            reviews = reviews.filter(decision='pending')
        elif decision.lower() == 'approved':
            reviews = reviews.filter(decision='approved')
        elif decision.lower() == 'rejected':
            reviews = reviews.filter(decision='rejected')
    
    # Filter by campaign if provided
    campaign_id = request.query_params.get('campaign')
    if campaign_id:
        reviews = reviews.filter(campaign_id=campaign_id)
    
    # Count total for pagination
    total_count = reviews.count()
    
    # Handle pagination
    page = request.query_params.get('page')
    page_size = 10  # Default page size
    
    if page:
        try:
            page = int(page)
            start = (page - 1) * page_size
            end = start + page_size
            reviews = reviews[start:end]
        except ValueError:
            pass
    
    # Format the response as expected by frontend
    from access.serializers import ReviewSerializer
    serializer = ReviewSerializer(reviews, many=True)
    
    # Return a paginated response structure
    response_data = {
        'results': serializer.data,
        'count': total_count,
        'next': None if (page * page_size >= total_count) else f"?page={page + 1}",
        'previous': None if page <= 1 else f"?page={page - 1}"
    }
    
    # If no reviews, ensure we return an empty array for results
    if not reviews:
        response_data['results'] = []
    
    return Response(response_data)

urlpatterns = [
    path('campaigns/', campaign_list, name='campaign-list'),
    path('reviews/', review_list, name='review-list'),
    path('', include(campaign_router.urls)),
    path('', include(review_router.urls)),
] 