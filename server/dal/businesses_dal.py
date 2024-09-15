from bson import ObjectId
import json
from bson import json_util

class BusinessesDAL:
    def __init__(self, db):
        self.db = db

    def get_businesses(self):
        businesses = list(self.db.businesses.find(
            {
                "$or": [
                    {"isDeleted": False},
                    {"isDeleted": {"$exists": False}}
                ]
            },
            {"_id": 1, "name": 1, "address": 1, "placeId": 1}
        ))
        
        # Convert ObjectId to string for JSON serialization
        for business in businesses:
            business['_id'] = str(business['_id'])
        
        return businesses

    def get_business(self, business_id):
        business = self.db.businesses.find_one({"_id": business_id})
        
        if business:
            # Convert the MongoDB document to a JSON-serializable format
            return json.loads(json_util.dumps(business))
        else:
            return None