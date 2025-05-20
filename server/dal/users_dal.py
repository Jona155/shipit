import uuid
from datetime import datetime
import logging
import json

class UsersDAL:
    def __init__(self, db):
        self.db = db

    # New method added to retrieve a user by ID
    def get_user(self, user_id):
        return self.db.users.find_one({"_id": user_id})

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
        logging.info(f"Starting update for user {user_id} with data: {json.dumps(data)}")
        update_fields = {}
        
        # Basic user info updates
        if 'name' in data:
            update_fields["name"] = data.get('name')
        if 'phoneNumber' in data:
            update_fields["phoneNumber"] = data.get('phoneNumber')
            
        if update_fields:
            logging.info(f"Updating basic user fields: {json.dumps(update_fields)}")
            user_update_result = self.db.users.update_one(
                {"_id": user_id},
                {"$set": update_fields}
            )
            logging.info(f"Basic user update result: modified={user_update_result.modified_count}")
        else:
            logging.info("No basic user fields to update")
            user_update_result = None

        # Handle messenger profile updates
        profile_updates = {}
        if data.get('type') == 'messenger' and 'isCurrentlyOnShift' in data:
            logging.info(f"Processing messenger profile update, shift status: {data.get('isCurrentlyOnShift')}")
            profile_updates = {
                "profiles.messenger.isCurrentlyOnShift": data.get('isCurrentlyOnShift'),
                "profiles.messenger.isCurrentlyAvailable": data.get('isCurrentlyOnShift'),  # Match availability with shift status
                "profiles.messenger.isWhileMission": False  # Always false when toggling
            }
            
            # If profilesUpdate is provided, use its values for more detailed control
            if 'profilesUpdate' in data and 'messenger' in data['profilesUpdate']:
                logging.info("Using profilesUpdate data for detailed control")
                messenger_updates = data['profilesUpdate']['messenger']
                if 'isCurrentlyOnShift' in messenger_updates:
                    profile_updates["profiles.messenger.isCurrentlyOnShift"] = messenger_updates['isCurrentlyOnShift']
                if 'isCurrentlyAvailable' in messenger_updates:
                    profile_updates["profiles.messenger.isCurrentlyAvailable"] = messenger_updates['isCurrentlyAvailable']
                if 'isWhileMission' in messenger_updates:
                    profile_updates["profiles.messenger.isWhileMission"] = messenger_updates['isWhileMission']
             
            # Check if user_businesses document exists for this user
            business_record = self.db.user_businesses.find_one({"uid": user_id})
            if not business_record:
                logging.error(f"No business record found for user {user_id}")
                return False
                   
            # Update the user_businesses collection
            logging.info(f"Updating profiles with: {json.dumps(profile_updates)}")
            business_update_result = self.db.user_businesses.update_one(
                {"uid": user_id},
                {"$set": profile_updates}
            )
            logging.info(f"Profile update result: modified={business_update_result.modified_count}")
            
            # Return true if either basic user info or profile was updated
            result = (user_update_result and user_update_result.modified_count > 0) or \
                     (business_update_result and business_update_result.modified_count > 0)
            logging.info(f"Update result: {result}")
            return result
        
        # If only basic user info was updated, return its result
        result = user_update_result and user_update_result.modified_count > 0
        logging.info(f"Basic update only result: {result}")
        return result

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
