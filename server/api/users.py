from flask import Blueprint, jsonify, request
from services.database import get_db
import logging
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from bson import ObjectId
from datetime import datetime
import json

bp = Blueprint('users', __name__, url_prefix='/api/users')

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

@bp.route('/business/<business_id>')
def get_business_users(business_id):
    try:
        db = get_db()
        
        pipeline = [
            # Match documents in user_businesses collection for the given business
            {
                "$match": {
                    "bid": business_id
                }
            },
            # Look up corresponding user documents
            {
                "$lookup": {
                    "from": "users",
                    "localField": "uid",
                    "foreignField": "_id",
                    "as": "user_info"
                }
            },
            # Unwind the user_info array
            {
                "$unwind": "$user_info"
            },
            # Match only non-deleted users
            {
                "$match": {
                    "$or": [
                        {"user_info.isDeleted": False},
                        {"user_info.isDeleted": {"$exists": False}}
                    ]
                }
            },
            # Project only the fields we need
            {
                "$project": {
                    "uid": 1,
                    "profiles": 1,
                    "name": "$user_info.name",
                    "phoneNumber": "$user_info.phoneNumber"
                }
            }
        ]
        
        users = list(db.user_businesses.aggregate(pipeline))
        
        # Use the custom JSONEncoder to handle ObjectId and datetime serialization
        return json.dumps(users, cls=JSONEncoder), 200, {'Content-Type': 'application/json'}

    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logging.error(f"Database connection error: {str(e)}")
        return jsonify({"error": "Database connection error"}), 500
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@bp.route('/update/<user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        db = get_db()
        data = request.json

        # Update user in 'users' collection
        user_update_result = db.users.update_one(
            {"_id": user_id},
            {"$set": {
                "name": data.get('name'),
                "phoneNumber": data.get('phoneNumber')
            }}
        )

        # Update user_businesses if type is messenger and isCurrentlyOnShift is provided
        if data.get('type') == 'messenger' and 'isCurrentlyOnShift' in data:
            business_update_result = db.user_businesses.update_one(
                {"uid": user_id},
                {"$set": {
                    "profiles.messenger.isCurrentlyOnShift": data.get('isCurrentlyOnShift')
                }}
            )

        if user_update_result.modified_count > 0:
            return jsonify({"message": "User updated successfully"}), 200
        else:
            return jsonify({"error": "User not found or no changes made"}), 404

    except Exception as e:
        logging.error(f"Error updating user: {str(e)}")
        return jsonify({"error": f"An error occurred while updating the user: {str(e)}"}), 500

@bp.route('/delete/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        db = get_db()
        
        # Mark user as deleted in both collections
        db.users.update_one({"_id": user_id}, {"$set": {"isDeleted": True}})
        db.user_businesses.update_one({"uid": user_id}, {"$set": {"isDeleted": True}})
        
        return jsonify({"message": "User marked as deleted successfully"}), 200
    except Exception as e:
        logging.error(f"Error deleting user: {str(e)}")
        return jsonify({"error": "An error occurred while deleting the user"}), 500