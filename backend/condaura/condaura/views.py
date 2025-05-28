from django.http import JsonResponse

def home(request):
    """
    Home page view that returns API information
    """
    return JsonResponse({
        'name': 'Condaura API',
        'version': '1.0',
        'description': 'API pour la plateforme de revue d\'accès Condaura',
        'endpoints': {
            'authentication': '/api/token/',
            'users': '/api/users/',
            'campaigns': '/api/campaigns/',
            'access': '/api/',
            'admin': '/admin/'
        }
    }) 