from rest_framework import serializers
from datetime import datetime

class DemandSerializer(serializers.Serializer):
    username = serializers.CharField(required=True, max_length=100)
    address = serializers.CharField(required=True, max_length=255)
    latitude = serializers.FloatField(required=True)
    longitude = serializers.FloatField(required=True)
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
            "username": validated_data["username"],
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