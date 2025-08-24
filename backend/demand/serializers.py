from rest_framework import serializers
from datetime import datetime
from mongo_client import users_collection
import re

class DemandSerializer(serializers.Serializer):
    name = serializers.CharField(required=True, max_length=100)
    address = serializers.CharField(required=True, max_length=255)
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)
    mobile_no = serializers.IntegerField(required=True)
    text = serializers.CharField(required=False, allow_blank=True, default="")
    photo = serializers.ImageField(required=False, allow_null=True)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        default=list
    )

    def validate(self, data):
        """Validate latitude and longitude ranges"""
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if not (-90 <= latitude <= 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        
        if not (-180 <= longitude <= 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        
        return data

    def create(self, validated_data):
        # Remove latitude/longitude and create GeoJSON location
        latitude = validated_data.pop("latitude")
        longitude = validated_data.pop("longitude")
        
        # Create the complete document structure
        demand_doc = {
            "address": validated_data["address"],
            "location": {
                "type": "Point",
                "coordinates": [longitude, latitude]
            },
            "text": validated_data.get("text", ""),
            "tags": validated_data.get("tags", []),
            "status": "pending",
            "created_at": datetime.now()
        }
        
        return demand_doc



class UserRegisterSerializer(serializers.Serializer):
    name = serializers.CharField(required=True, max_length=100, min_length=3)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, min_length=6, write_only=True)
    phone = serializers.CharField(required=True, max_length=15)
    address = serializers.CharField(required=True, max_length=255)
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)

    def validate_email(self, value):
        # Check if email already exists
        from mongo_client import users_collection
        if users_collection.find_one({"email": value.lower()}):
            raise serializers.ValidationError("Email already registered")
        return value.lower()

    def validate_phone(self, value):
        # Basic phone validation
        if not re.match(r'^\+?[0-9]{10,15}$', value):
            raise serializers.ValidationError("Invalid phone number format")
        
        # Check if phone already exists
        from mongo_client import users_collection
        if users_collection.find_one({"phone": value}):
            raise serializers.ValidationError("Phone number already registered")
        
        return value

    def validate(self, data):
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if not (-90 <= latitude <= 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        
        if not (-180 <= longitude <= 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        
        return data

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)