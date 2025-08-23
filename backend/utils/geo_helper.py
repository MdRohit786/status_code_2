# utils/geo_helper.py - Updated with better debugging
from math import radians, sin, cos, sqrt, atan2

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two points 
    on the Earth's surface using the Haversine formula
    Returns distance in meters
    """
    # Validate coordinates
    if not (-90 <= lat1 <= 90) or not (-90 <= lat2 <= 90):
        raise ValueError(f"Invalid latitude: {lat1} or {lat2}")
    if not (-180 <= lon1 <= 180) or not (-180 <= lon2 <= 180):
        raise ValueError(f"Invalid longitude: {lon1} or {lon2}")
    
    # Earth radius in meters
    R = 6371000
    
    # Convert degrees to radians
    lat1_rad = radians(lat1)
    lon1_rad = radians(lon1)
    lat2_rad = radians(lat2)
    lon2_rad = radians(lon2)
    
    # Differences
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    # Haversine formula
    a = sin(dlat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    distance = R * c
    return distance

def is_within_radius(lat1, lon1, lat2, lon2, radius_meters=50):
    """
    Check if two points are within specified radius
    """
    try:
        distance = calculate_distance(lat1, lon1, lat2, lon2)
        return distance <= radius_meters
    except ValueError as e:
        print(f"Coordinate validation error: {e}")
        return False