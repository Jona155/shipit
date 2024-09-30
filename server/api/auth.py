from flask import Blueprint, request, jsonify, current_app
from dal.auth_dal import AuthDAL
import logging

from services.database import get_db

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/login', methods=['POST'])
def login():
    try:
        db = get_db()
        auth_dal = AuthDAL(db)
        data = request.json

        if not data or 'username' not in data or 'password' not in data:
            return jsonify({"error": "Missing username or password"}), 400

        user = auth_dal.validate_user(data['username'], data['password'])
        if user:
            token, expiration = auth_dal.create_token(str(user['_id']))
            return jsonify({
                "token": token,
                "expirationTime": expiration.isoformat(),
                "userId": str(user['_id']),
                "name": user['name']
            }), 200
        else:
            return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        logging.error(f"Login error: {str(e)}")
        return jsonify({"error": "An error occurred during login"}), 500

@bp.route('/logout', methods=['POST'])
def logout():
    try:
        db = get_db()
        auth_dal = AuthDAL(db)
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({"error": "No token provided"}), 400

        auth_dal.invalidate_token(token)
        return jsonify({"message": "Logged out successfully"}), 200
    except Exception as e:
        logging.error(f"Logout error: {str(e)}")
        return jsonify({"error": "An error occurred during logout"}), 500

@bp.route('/validate-token', methods=['GET'])
def validate_token():
    try:
        db = get_db()
        auth_dal = AuthDAL(db)
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({"error": "No token provided"}), 400

        user_id = auth_dal.validate_token(token)
        if user_id:
            return jsonify({"valid": True, "userId": user_id}), 200
        else:
            return jsonify({"valid": False}), 401
    except Exception as e:
        logging.error(f"Token validation error: {str(e)}")
        return jsonify({"error": "An error occurred during token validation"}), 500

@bp.route('/cleanup-tokens', methods=['POST'])
def cleanup_tokens():
    try:
        db = get_db()
        auth_dal = AuthDAL(db)
        deleted_count = auth_dal.cleanup_expired_tokens()
        return jsonify({"message": f"Cleaned up {deleted_count} expired tokens"}), 200
    except Exception as e:
        logging.error(f"Token cleanup error: {str(e)}")
        return jsonify({"error": "An error occurred during token cleanup"}), 500