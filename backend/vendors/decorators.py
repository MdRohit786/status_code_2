from rest_framework.response import Response
from rest_framework import status
from functools import wraps
from utils.auth_helper import verify_jwt_token

def vendor_login_required(view_func):
    @wraps(view_func)
    def wrapper(self, request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response(
                {"error": "Authorization token required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return Response(
                {"error": "Invalid or expired token"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        request.vendor_id = payload['vendor_id']
        request.vendor_email = payload['email']
        
        return view_func(self, request, *args, **kwargs)
    
    return wrapper