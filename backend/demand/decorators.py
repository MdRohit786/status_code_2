from rest_framework.response import Response
from rest_framework import status
from functools import wraps
from utils.auth_helper import verify_jwt_token
from mongo_client import users_collection, vendors_collection

def login_required(view_func):
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
        
        # Add user info to request based on user type
        user_type = payload.get('user_type', 'user')
        user_id = payload['user_id']
        
        if user_type == 'vendor':
            vendor = vendors_collection.find_one({"_id": ObjectId(user_id)})
            if not vendor:
                return Response(
                    {"error": "Vendor not found"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            request.user_type = 'vendor'
            request.vendor_id = user_id
            request.vendor_email = payload['email']
        else:
            user = users_collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            request.user_type = 'user'
            request.user_id = user_id
            request.user_email = payload['email']
        
        return view_func(self, request, *args, **kwargs)
    
    return wrapper