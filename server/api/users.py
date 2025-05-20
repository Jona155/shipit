from datetime import datetime
from bson import ObjectId
from flask import Blueprint, jsonify, request
from services.database import get_db
import logging
from dal.users_dal import UsersDAL
import json

bp = Blueprint('users', __name__, url_prefix='/api/users')

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

@bp.route('/business/<business_id>/')
def get_business_users(business_id):
    try:
        logging.info(f"Request for users in business: {business_id}")
        db = get_db()
        users_dal = UsersDAL(db)
        users = users_dal.get_business_users(business_id)
        logging.info(f"Found {len(users)} users")
        
        # Debug: Print the route we're handling
        logging.info("Handling business users route for API")
        
        # Ensure explicit JSON content type and headers
        response_data = json.dumps(users, cls=JSONEncoder)
        
        # Debug: Print response data (truncated)
        logging.info(f"Responding with data (truncated): {response_data[:100]}...")
        
        # Return with explicit JSON MIME type
        return response_data, 200, {'Content-Type': 'application/json'}
    except Exception as e:
        logging.error(f"Unexpected error in get_business_users: {str(e)}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@bp.route('/update/<user_id>', methods=['PUT'])
@bp.route('/update/<user_id>/', methods=['PUT'])
def update_user(user_id):
    try:
        db = get_db()
        users_dal = UsersDAL(db)
        data = request.json
        
        # Add detailed logging
        logging.info(f"Updating user {user_id} with data: {json.dumps(data)}")
        
        # Check if user exists before attempting update
        user = users_dal.get_user(user_id)
        if not user:
            logging.error(f"User not found: {user_id}")
            return jsonify({"error": "User not found", "userId": user_id}), 404
            
        # Validate required fields based on update type
        if data.get('type') == 'messenger' and 'isCurrentlyOnShift' in data:
            # For shift status updates, validate profilesUpdate if provided
            if 'profilesUpdate' in data and 'messenger' not in data['profilesUpdate']:
                logging.error(f"Missing messenger profile in profilesUpdate: {json.dumps(data)}")
                return jsonify({"error": "Missing messenger profile in profilesUpdate"}), 400
        
        # Perform the update
        logging.info(f"Calling users_dal.update_user for {user_id}")
        success = users_dal.update_user(user_id, data)
        
        if success:
            # Return the updated user data
            updated_user = users_dal.get_user(user_id)
            logging.info(f"User updated successfully: {user_id}")
            return jsonify({
                "message": "User updated successfully",
                "user": json.loads(json.dumps(updated_user, cls=JSONEncoder))
            }), 200
        else:
            logging.info(f"No changes made to user: {user_id}")
            return jsonify({"error": "No changes were made", "userId": user_id}), 304
    except Exception as e:
        logging.error(f"Error updating user {user_id}: {str(e)}")
        import traceback
        logging.error(traceback.format_exc())
        return jsonify({
            "error": f"An error occurred while updating the user",
            "details": str(e),
            "userId": user_id
        }), 500

@bp.route('/delete/<user_id>', methods=['DELETE'])
@bp.route('/delete/<user_id>/', methods=['DELETE'])
def delete_user(user_id):
    try:
        db = get_db()
        users_dal = UsersDAL(db)
        users_dal.delete_user(user_id)
        return jsonify({"message": "User marked as deleted successfully"}), 200
    except Exception as e:
        logging.error(f"Error deleting user: {str(e)}")
        return jsonify({"error": "An error occurred while deleting the user"}), 500

@bp.route('/add', methods=['POST'])
@bp.route('/add/', methods=['POST'])
def add_user():
    try:
        db = get_db()
        users_dal = UsersDAL(db)
        data = request.json

        required_fields = ['name', 'phoneNumber', 'type', 'businessId']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        user_id = users_dal.add_user(data)
        return jsonify({"message": "User added successfully", "userId": user_id}), 201
    except Exception as e:
        logging.error(f"Error adding user: {str(e)}")
        return jsonify({"error": f"An error occurred while adding the user: {str(e)}"}), 500