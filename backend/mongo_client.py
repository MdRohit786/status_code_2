
from pymongo import MongoClient

client = MongoClient("mongodb+srv://RDS:Rds1234@cluster0.fie8cdm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")

db = client["status_code_2"]


users_collection = db["users"]
vendors_collection = db["vendors"]
demands_collection = db["demands"]
