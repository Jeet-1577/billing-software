from django.shortcuts import redirect
from django.urls import reverse

class AuthenticationMiddleware:
    """
    Middleware to ensure user authentication for protected routes.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Paths that don't require authentication
        public_paths = [
            '/login/',
            '/api/login/',
            '/logout/',
            '/api/logout/',
            '/static/',
            '/media/',
            '/admin/',
            '/__reload__/',  # Add this to allow browser reload functionality
        ]
        
        # Check if request path matches any public path
        is_public = any(request.path.startswith(path) for path in public_paths)
        
        # If not a public path and user is not authenticated, redirect to login
        if not is_public and 'user_id' not in request.session:
            # Always redirect to the root /login/ path, not /api/login/
            return redirect('/login/')
            
        response = self.get_response(request)
        return response
