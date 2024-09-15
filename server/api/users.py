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

@bp.route('/business/<business_id>')
def get_business_users(business_id):
    try:
        db = get_db()
        users_dal = UsersDAL(db)
        users = users_dal.get_business_users(business_id)
        return json.dumps(users, cls=JSONEncoder), 200, {'Content-Type': 'application/json'}
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@bp.route('/update/<user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        db = get_db()
        users_dal = UsersDAL(db)
        data = request.json
        success = users_dal.update_user(user_id, data)
        if success:
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
        users_dal = UsersDAL(db)
        users_dal.delete_user(user_id)
        return jsonify({"message": "User marked as deleted successfully"}), 200
    except Exception as e:
        logging.error(f"Error deleting user: {str(e)}")
        return jsonify({"error": "An error occurred while deleting the user"}), 500

@bp.route('/add', methods=['POST'])
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