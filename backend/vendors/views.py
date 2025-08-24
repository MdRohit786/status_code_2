from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import VendorLocationSerializer,DeliverOrderSerializer,AcceptOrderSerializer,VendorLoginSerializer,VendorRegisterSerializer
from mongo_client import demands_collection,vendors_collection
from datetime import datetime
from bson import ObjectId
import logging
from .decorators import vendor_login_required
from utils.auth_helper import hash_password, verify_password, generate_jwt_token
from utils.geo_helper import is_within_radius,calculate_distance  
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


class VendorNearestOrdersView(APIView):
    @vendor_login_required
    def post(self, request):
        serializer = VendorLocationSerializer(data=request.data)
        if serializer.is_valid():
            vendor_data = serializer.validated_data
            vendor_location = [vendor_data["longitude"], vendor_data["latitude"]]

            pipeline = [
                {
                    "$geoNear": {
                        "near": {"type": "Point", "coordinates": vendor_location},
                        "distanceField": "distance",
                        "maxDistance": 5000,
                        "spherical": True
                    }
                },
                {"$limit": 5}
            ]

            demands = list(demands_collection.aggregate(pipeline))

            response_data = []
            for d in demands:
                response_data.append({
                    "id": str(d["_id"]),
                    "username": d["username"],
                    "address": d["address"],
                    "latitude": d["location"]["coordinates"][1],
                    "longitude": d["location"]["coordinates"][0],
                    "status": d["status"],
                    "text": d.get("text", ""),
                    "tags": d.get("tags", []),
                    "distance_meters": round(d["distance"], 2)
                })

            return Response(response_data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class VendorRegisterView(APIView):
    def post(self, request):
        serializer = VendorRegisterSerializer(data=request.data)
        
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
            
            # Create vendor document
            vendor_doc = {
                "name": data['name'],
                "email": data['email'],
                "password": hashed_password,
                "phone": data['phone'],
                "address": data['address'],
                "location": location,
                "business_name": data['business_name'],
                "category": data['category'],
                "accepted_orders": [],
                "total_orders_accepted": 0,
                "rating": 0,
                "reviews": [],
                "is_active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            # Insert into MongoDB
            result = vendors_collection.insert_one(vendor_doc)
            
            # Generate JWT token
            token = generate_jwt_token(result.inserted_id, data['email'])
            
            return Response(
                {
                    "message": "Vendor registered successfully",
                    "vendor_id": str(result.inserted_id),
                    "token": token,
                    "email": data['email']
                },
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            logger.error(f"Vendor registration error: {e}")
            return Response(
                {"error": "An error occurred during registration"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VendorLoginView(APIView):
    def post(self, request):
        serializer = VendorLoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            data = serializer.validated_data
            email = data['email'].lower()
            password = data['password']
            
            # Find vendor by email
            vendor = vendors_collection.find_one({"email": email})
            
            if not vendor:
                return Response(
                    {"error": "Invalid email or password"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Verify password
            if not verify_password(password, vendor['password']):
                return Response(
                    {"error": "Invalid email or password"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check if vendor is active
            if not vendor.get('is_active', True):
                return Response(
                    {"error": "Vendor account is deactivated"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Generate JWT token
            token = generate_jwt_token(vendor['_id'], vendor['email'])
            
            return Response(
                {
                    "message": "Login successful",
                    "token": token,
                    "vendor_id": str(vendor['_id']),
                    "name": vendor['name'],
                    "business_name": vendor['business_name']
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Vendor login error: {e}")
            return Response(
                {"error": "An error occurred during login"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class AcceptOrderView(APIView):
    @vendor_login_required
    def post(self, request):
        serializer = AcceptOrderSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            demand_id = serializer.validated_data['demand_id']
            vendor_id = request.vendor_id

            # DEBUG: Log the start of the process
            logger.info(f"AcceptOrderView started for demand_id: {demand_id}, vendor_id: {vendor_id}")

            if not ObjectId.is_valid(demand_id):
                logger.warning(f"Invalid demand ID format: {demand_id}")
                return Response({"error": "Invalid demand ID format"}, status=status.HTTP_400_BAD_REQUEST)
            
            demand = demands_collection.find_one({"_id": ObjectId(demand_id), "status": "pending"})
            if not demand:
                logger.warning(f"Demand not found or already accepted: {demand_id}")
                return Response({"error": "Demand not found or already accepted"}, status=status.HTTP_404_NOT_FOUND)
            
            # DEBUG: Log the demand object (without sensitive data)
            logger.info(f"Demand found: {demand_id}, email: {demand.get('email', 'NOT_SET')}")
            
            vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id)})
            if not vendor:
                logger.warning(f"Vendor not found: {vendor_id}")
                return Response({"error": "Vendor not found"}, status=status.HTTP_404_NOT_FOUND)

            # DEBUG: Log vendor details
            logger.info(f"Vendor found: {vendor_id}, name: {vendor.get('name', 'Unknown')}")

            # Update demand
            update_result = demands_collection.update_one(
                {"_id": ObjectId(demand_id)},
                {
                    "$set": {
                        "status": "accepted",
                        "accepted_by": vendor_id,
                        "accepted_at": datetime.now(),
                        "vendor_info": {
                            "vendor_id": vendor_id,
                            "vendor_name": vendor.get('name', ''),
                            "business_name": vendor.get('business_name', ''),
                            "accepted_at": datetime.now()
                        }
                    }
                }
            )

            if update_result.modified_count == 0:
                logger.error(f"Failed to update demand: {demand_id}")
                return Response({"error": "Failed to accept order"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Update vendor accepted orders
            vendors_collection.update_one(
                {"_id": ObjectId(vendor_id)},
                {
                    "$push": {
                        "accepted_orders": {
                            "demand_id": demand_id,
                            "accepted_at": datetime.now(),
                            "customer_name": demand.get('name', 'Customer'),
                            "customer_address": demand.get('address', ''),
                            "status": "accepted"
                        }
                    },
                    "$inc": {"total_orders_accepted": 1},
                    "$set": {"updated_at": datetime.now()}
                }
            )

            # ---- Send Email to Customer ----
            email_status = "not_sent"
            email_error = None
            
            customer_email = demand.get("email")
            logger.info(f"Customer email from demand: {customer_email}")
            
            if customer_email:
                try:
                    # DEBUG: Detailed email logging
                    logger.info(f"Attempting to send email to: {customer_email}")
                    logger.info(f"Using FROM email: {settings.DEFAULT_FROM_EMAIL}")
                    logger.info(f"EMAIL_HOST_USER from settings: {settings.EMAIL_HOST_USER}")
                    
                    # Test email settings first
                    logger.info("Testing email configuration...")
                    from django.core.mail import get_connection
                    connection = get_connection()
                    connection.open()  # This will raise an exception if configuration is wrong
                    connection.close()
                    logger.info("Email connection test passed")
                    
                    subject = "Your Order Has Been Accepted!"
                    message = f"""
                    Hello {demand.get('name', 'Customer')},

                    Great news! Your order has been accepted by {vendor.get('business_name', vendor.get('name', 'a vendor'))}.

                    Order Details:
                    - Order ID: {demand_id}
                    - Vendor: {vendor.get('business_name', vendor.get('name', 'Vendor'))}
                    - Delivery Address: {demand.get('address', '')}
                    - Status: Accepted ✅

                    The vendor will contact you shortly for further details.

                    Thank you for using our service!

                    Best regards,
                    {vendor.get('business_name', 'The Vendor Team')}
                    """
                    
                    # DEBUG: Log email content (truncated for security)
                    logger.info(f"Email subject: {subject}")
                    logger.info(f"Email message length: {len(message)} characters")
                    
                    # Send email
                    send_mail(
                        subject=subject,
                        message=message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[customer_email],
                        fail_silently=False,
                    )
                    
                    email_status = "sent"
                    logger.info(f"Email successfully sent to {customer_email}")
                    
                except Exception as e:
                    email_status = "failed"
                    email_error = str(e)
                    logger.error(f"Failed to send email to {customer_email}: {e}")
                    logger.error(f"Error type: {type(e).__name__}")
                    
                    # Log full email configuration for debugging
                    logger.error("Email configuration details:")
                    logger.error(f"EMAIL_BACKEND: {getattr(settings, 'EMAIL_BACKEND', 'Not set')}")
                    logger.error(f"EMAIL_HOST: {getattr(settings, 'EMAIL_HOST', 'Not set')}")
                    logger.error(f"EMAIL_PORT: {getattr(settings, 'EMAIL_PORT', 'Not set')}")
                    logger.error(f"EMAIL_USE_TLS: {getattr(settings, 'EMAIL_USE_TLS', 'Not set')}")
                    logger.error(f"EMAIL_HOST_USER: {getattr(settings, 'EMAIL_HOST_USER', 'Not set')}")
                    logger.error(f"DEFAULT_FROM_EMAIL: {getattr(settings, 'DEFAULT_FROM_EMAIL', 'Not set')}")
                    # Don't log password for security reasons

            else:
                logger.warning(f"No email found for demand: {demand_id}")
                email_status = "no_email"

            response_data = {
                "message": "Order accepted successfully",
                "demand_id": str(demand_id), 
                "vendor_id": str(vendor_id), 
                "status": "accepted",
                "email_status": email_status
            }
            
            if email_error:
                response_data["email_error"] = email_error
            
            logger.info(f"AcceptOrderView completed successfully for demand: {demand_id}")
            return Response(response_data, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error in AcceptOrderView: {e}", exc_info=True)
            return Response(
                {"error": "An error occurred while accepting the order", "details": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        



class DeliverOrderView(APIView):
    @vendor_login_required
    def post(self, request):
        serializer = DeliverOrderSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            demand_id = serializer.validated_data['demand_id']
            delivery_lat = serializer.validated_data['latitude']
            delivery_lon = serializer.validated_data['longitude']
            vendor_id = request.vendor_id

            # Validate ObjectId format
            if not ObjectId.is_valid(demand_id):
                return Response(
                    {"error": "Invalid demand ID format"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if order exists and is accepted by this vendor
            order = demands_collection.find_one({
                "_id": ObjectId(demand_id),
                "status": "accepted",
                "accepted_by": vendor_id
            })

            if not order:
                return Response(
                    {"error": "Order not found, not accepted, or not accepted by this vendor"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get the original order location
            if 'location' not in order or 'coordinates' not in order['location']:
                return Response(
                    {"error": "Order location data is missing"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Extract coordinates - GeoJSON uses [longitude, latitude] order!
            order_coords = order['location']['coordinates']
            if len(order_coords) != 2:
                return Response(
                    {"error": "Invalid coordinate format in order location"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            order_lon, order_lat = order_coords
            
            # Debug output
            print(f"Order location: lat={order_lat}, lon={order_lon}")
            print(f"Delivery location: lat={delivery_lat}, lon={delivery_lon}")
            
            # Calculate actual distance
            try:
                actual_distance = calculate_distance(order_lat, order_lon, delivery_lat, delivery_lon)
                print(f"Calculated distance: {actual_distance:.2f} meters")
            except ValueError as e:
                return Response(
                    {"error": f"Invalid coordinates: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if vendor is within 50 meters of order location
            if not is_within_radius(order_lat, order_lon, delivery_lat, delivery_lon, 50):
                return Response(
                    {
                        "error": "You must be within 50 meters of the delivery location to mark as delivered",
                        "required_distance": 50,
                        "your_distance": round(actual_distance, 2),
                        "current_location": {
                            "latitude": delivery_lat,
                            "longitude": delivery_lon
                        },
                        "target_location": {
                            "latitude": order_lat,
                            "longitude": order_lon
                        },
                        "debug": {
                            "order_coordinates": order_coords,
                            "delivery_coordinates": [delivery_lon, delivery_lat]
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Rest of the delivery logic remains the same...
            # Create delivery location GeoJSON
            delivery_location = {
                "type": "Point",
                "coordinates": [delivery_lon, delivery_lat]
            }

            current_time = datetime.now()
            
            # Update demand collection
            demand_update = demands_collection.update_one(
                {"_id": ObjectId(demand_id)},
                {
                    "$set": {
                        "status": "delivered",
                        "delivered_at": current_time,
                        "delivery_location": delivery_location,
                        "delivered_by": vendor_id,
                        "delivery_distance_meters": round(actual_distance, 2)
                    }
                }
            )

            if demand_update.modified_count == 0:
                return Response(
                    {"error": "Failed to update order status"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Update vendor collection
            vendor_update = vendors_collection.update_one(
                {
                    "_id": ObjectId(vendor_id),
                    "accepted_orders.demand_id": demand_id
                },
                {
                    "$set": {
                        "accepted_orders.$.status": "delivered",
                        "accepted_orders.$.delivered_at": current_time,
                        "accepted_orders.$.delivery_location": delivery_location,
                        "accepted_orders.$.delivery_distance": round(actual_distance, 2),
                        "updated_at": current_time
                    },
                    "$inc": {"total_orders_delivered": 1}
                }
            )

            return Response(
                {
                    "message": "Order delivered successfully",
                    "demand_id": demand_id,
                    "status": "delivered",
                    "delivered_at": current_time.isoformat(),
                    "delivery_distance_meters": round(actual_distance, 2),
                    "delivery_location": {
                        "latitude": delivery_lat,
                        "longitude": delivery_lon
                    }
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.error(f"Error delivering order: {str(e)}")
            return Response(
                {"error": "An error occurred while delivering the order"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )