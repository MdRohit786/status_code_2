from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import DemandSerializer,UserRegisterSerializer, UserLoginSerializer
from mongo_client import demands_collection,users_collection
from utils.gemini_helper import generate_tags
from pymongo.errors import PyMongoError
import logging
from datetime import datetime
from utils.auth_helper import hash_password, verify_password, generate_jwt_token
from bson import ObjectId
import bcrypt
import jwt
from datetime import datetime, timedelta
from django.conf import settings

logger = logging.getLogger(__name__)

class DemandCreateView(APIView):
    def post(self, request):
        serializer = DemandSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Use save() to get the created data with location
            demand_doc = serializer.save()
            
            text = demand_doc.get("text", "")
            photo = request.data.get("photo", None)  # Get photo from request

            # Generate tags using Gemini
            tags = generate_tags(text=text, photo=photo)
            if not tags:
                return Response(
                    {"error": "Could not generate tags. Please provide text or photo."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update the document with generated tags
            demand_doc["tags"] = tags

            # Insert into MongoDB
            result = demands_collection.insert_one(demand_doc)

            return Response(
                {
                    "message": "Demand created successfully",
                    "id": str(result.inserted_id),
                    "tags": tags
                },
                status=status.HTTP_201_CREATED
            )
            
        except PyMongoError as e:
            logger.error(f"MongoDB error: {e}")
            return Response(
                {"error": "Database error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        




SECRET_KEY = getattr(settings, 'SECRET_KEY', 'your-secret-key-here')

def hash_password(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password, hashed_password):
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except (ValueError, TypeError):
        return False

def generate_jwt_token(user_id, email, user_type='user'):
    payload = {
        'user_id': str(user_id),
        'email': email,
        'user_type': user_type,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    return token

class UserRegisterView(APIView):
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            data = serializer.validated_data
            
            # Create location GeoJSON
            location = {
                "type": "Point",
                "coordinates": [data['longitude'], data['latitude']]
            }
            
            # Hash password
            hashed_password = hash_password(data['password'])
            
            # Create user document
            user_doc = {
                "name": data['name'],
                "email": data['email'],
                "password": hashed_password,
                "phone": data['phone'],
                "address": data['address'],
                "location": location,
                "orders_created": [],
                "orders_received": [],
                "is_active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            # Insert into MongoDB
            result = users_collection.insert_one(user_doc)
            
            # Generate JWT token
            token = generate_jwt_token(result.inserted_id, data['email'], 'user')
            
            return Response(
                {
                    "message": "User registered successfully",
                    "user_id": str(result.inserted_id),
                    "token": token,
                    "name": data['name'],
                    "email": data['email']
                },
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            logger.error(f"User registration error: {e}")
            return Response(
                {"error": "An error occurred during registration"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserLoginView(APIView):
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            data = serializer.validated_data
            email = data['email'].lower()
            password = data['password']
            
            # Find user by email
            user = users_collection.find_one({"email": email})
            
            if not user:
                return Response(
                    {"error": "Invalid email or password"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Verify password
            if not verify_password(password, user['password']):
                return Response(
                    {"error": "Invalid email or password"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check if user is active
            if not user.get('is_active', True):
                return Response(
                    {"error": "User account is deactivated"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Generate JWT token
            token = generate_jwt_token(user['_id'], user['email'], 'user')
            
            return Response(
                {
                    "message": "Login successful",
                    "token": token,
                    "user_id": str(user['_id']),
                    "name": user['name'],
                    "email": user['email']
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"User login error: {e}")
            return Response(
                {"error": "An error occurred during login"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserProfileView(APIView):
    def get(self, request):
        # Check authorization header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response(
                {"error": "Authorization token required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token = auth_header.split(' ')[1]
        
        # Verify token
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return Response(
                {"error": "Invalid or expired token"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user exists
        user_id = payload.get('user_id')
        user_type = payload.get('user_type')
        
        if user_type != 'user':
            return Response(
                {"error": "Access denied. User account required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = users_collection.find_one(
                {"_id": ObjectId(user_id)},
                {"password": 0}  # Exclude password from response
            )
            
            if not user:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Convert ObjectId to string for JSON serialization
            user['_id'] = str(user['_id'])
            
            return Response(
                {
                    "message": "User profile retrieved successfully",
                    "user": user
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error fetching user profile: {e}")
            return Response(
                {"error": "An error occurred while fetching profile"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )