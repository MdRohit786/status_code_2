from rest_framework import serializers
from datetime import datetime
import re
from bson import ObjectId
from mongo_client import vendors_collection

class VendorLocationSerializer(serializers.Serializer):
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)



class VendorRegisterSerializer(serializers.Serializer):
    name = serializers.CharField(required=True, max_length=100)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, min_length=6, write_only=True)
    phone = serializers.CharField(required=True, max_length=15)
    address = serializers.CharField(required=True, max_length=255)
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)
    business_name = serializers.CharField(required=True, max_length=100)
    category = serializers.CharField(required=True, max_length=50)

    def validate_email(self, value):
        # Check if email already exists
        if vendors_collection.find_one({"email": value.lower()}):
            raise serializers.ValidationError("Email already registered")
        return value.lower()

    def validate_phone(self, value):
        # Basic phone validation
        if not re.match(r'^\+?[0-9]{10,15}$', value):
            raise serializers.ValidationError("Invalid phone number format")
        return value

    def validate(self, data):
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if not (-90 <= latitude <= 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        
        if not (-180 <= longitude <= 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        
        return data

class VendorLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

class AcceptOrderSerializer(serializers.Serializer):
    demand_id = serializers.CharField(required=True, max_length=24)


class DeliverOrderSerializer(serializers.Serializer):
    demand_id = serializers.CharField(required=True, max_length=24)
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)

    def validate(self, data):
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if not (-90 <= latitude <= 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        
        if not (-180 <= longitude <= 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        
        return data