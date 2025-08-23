from mongo_client import demands_collection
from pymongo import GEOSPHERE

def create_geospatial_index():
    try:
        indexes = demands_collection.index_information()
        geospatial_index_exists = any(
            any('location' in str(key) and '2dsphere' in str(val) 
                for key, val in index_def['key'])
            for index_def in indexes.values()
        )
        
        if not geospatial_index_exists:
            demands_collection.create_index([("location", GEOSPHERE)])
            print("2dsphere index created successfully!")
        else:
            print("Geospatial index already exists")
            
    except Exception as e:
        print(f"Error creating index: {e}")

if __name__ == "__main__":
    create_geospatial_index()