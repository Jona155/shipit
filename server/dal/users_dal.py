import uuid
from datetime import datetime
from bson import ObjectId
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import logging

class UsersDAL:
    def __init__(self, db):
        self.db = db

    def get_business_users(self, business_id):
        pipeline = [
            {"$match": {"bid": business_id}},
            {"$lookup": {
                "from": "users",
                "localField": "uid",
                "foreignField": "_id",
                "as": "user_info"
            }},
            {"$unwind": "$user_info"},
            {"$match": {
                "$or": [
                    {"user_info.isDeleted": False},
                    {"user_info.isDeleted": {"$exists": False}}
                ]
            }},
            {"$project": {
                "uid": 1,
                "profiles": 1,
                "name": "$user_info.name",
                "phoneNumber": "$user_info.phoneNumber"
            }}
        ]
        return list(self.db.user_businesses.aggregate(pipeline))

    def update_user(self, user_id, data):
        user_update_result = self.db.users.update_one(
            {"_id": user_id},
            {"$set": {
                "name": data.get('name'),
                "phoneNumber": data.get('phoneNumber')
            }}
        )

        if data.get('type') == 'messenger' and 'isCurrentlyOnShift' in data:
            self.db.user_businesses.update_one(
                {"uid": user_id},
                {"$set": {
                    "profiles.messenger.isCurrentlyOnShift": data.get('isCurrentlyOnShift')
                }}
            )

        return user_update_result.modified_count > 0

    def delete_user(self, user_id):
        self.db.users.update_one({"_id": user_id}, {"$set": {"isDeleted": True}})
        self.db.user_businesses.update_one({"uid": user_id}, {"$set": {"isDeleted": True}})

    def add_user(self, data):
        user_id = str(uuid.uuid4())
        new_user = {
            "_id": user_id,
            "name": data['name'],
            "phoneNumber": data['phoneNumber'],
            "username": data.get('username'),
            "password": data.get('password'),
            "deviceInfo": {
                "userId": str(uuid.uuid4()),
                "os": "unknown"
            }
        }
        self.db.users.insert_one(new_user)

        current_time = datetime.utcnow()
        user_business = {
            "_id": str(uuid.uuid4()),
            "uid": user_id,
            "bid": data['businessId'],
            "profiles": {
                data['type']: {
                    "isCurrentlyOnShift": data['type'] == 'messenger',
                    "isCurrentlyAvailable": data['type'] == 'messenger',
                    "lastAvailableTimestamp": current_time,
                    "lastNonAvailableTimestamp": current_time,
                    "location": {
                        "lat": 0,
                        "lng": 0,
                        "timestamp": current_time,
                        "bearing": 0
                    },
                    "isWhileMission": False
                }
            },
            "isDeleted": False
        }
        self.db.user_businesses.insert_one(user_business)

        return user_id