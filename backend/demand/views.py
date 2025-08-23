from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import DemandSerializer
from mongo_client import demands_collection
from utils.gemini_helper import generate_tags
from pymongo.errors import PyMongoError
import logging
import datetime

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