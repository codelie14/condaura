from rest_framework import permissions, status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
import uuid

# Import RefreshToken safely
try:
    from rest_framework_simplejwt.tokens import RefreshToken
except ImportError:
    # Fallback if there's an import error
    RefreshToken = None
    import traceback
    print("Error importing RefreshToken:", traceback.format_exc())

from .serializers import RegisterSerializer

User = get_user_model()

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """Custom login view that returns JWT token and user data"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({'detail': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Find user by email
    try:
        # First try to find by email
        user = User.objects.filter(email=email).first()
        if not user:
            # Then try by username
            user = User.objects.filter(username=email).first()
        
        if not user:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        print(f"Error finding user: {str(e)}")
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Check password
    if not user.check_password(password):
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Generate token
    try:
        if RefreshToken is None:
            return Response({'detail': 'JWT authentication is not available'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        refresh = RefreshToken.for_user(user)
        tokens = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        
        # Format response to match frontend expectations
        return Response({
            'token': tokens['access'],
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role if hasattr(user, 'role') else 'user'
            }
        })
    except Exception as e:
        print(f"Error generating token: {str(e)}")
        return Response({'detail': 'Authentication failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        # Automatically set username to email if not provided
        data = request.data.copy()
        if 'email' in data and 'username' not in data:
            data['username'] = data['email']
        
        # Generate a user_id if not provided
        if 'user_id' not in data:
            data['user_id'] = f"U{str(uuid.uuid4())[:8]}"
        
        print(f"Register data received: {data}")
        
        # Check if user already exists
        email = data.get('email')
        username = data.get('username')
        
        # For the MVP, if the username already exists, generate a new one
        if username and User.objects.filter(username=username).exists():
            # Generate a unique username by appending random characters
            base_username = username.split('@')[0]
            random_suffix = uuid.uuid4().hex[:6]
            data['username'] = f"{base_username}_{random_suffix}"
            print(f"Username already exists. Using new username: {data['username']}")
        
        # Check if email already exists
        if email and User.objects.filter(email=email).exists():
            return Response(
                {'detail': f'User with email {email} already exists. Please login instead.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=data)
        
        if not serializer.is_valid():
            print(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = serializer.save()
            
            # Generate token for the newly registered user
            try:
                if RefreshToken is None:
                    return Response({'detail': 'JWT authentication is not available'}, 
                                   status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                refresh = RefreshToken.for_user(user)
                tokens = {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
                
                # Format response to match frontend expectations
                return Response({
                    'token': tokens['access'],
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role if hasattr(user, 'role') else 'user'
                    }
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                print(f"Error generating token: {str(e)}")
                # Return user data without token as fallback
                return Response({
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role if hasattr(user, 'role') else 'user'
                    }
                }, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Error during registration: {str(e)}")
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST) 