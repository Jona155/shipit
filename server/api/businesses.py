# from flask import Blueprint, jsonify
# import logging
# from dal.businesses_dal import BusinessesDAL
# from services.database import get_db
#
# bp = Blueprint('businesses', __name__, url_prefix='/api/businesses')
#
#
# @bp.route('/')
# def get_businesses():
#     try:
#         db = get_db()
#         businesses_dal = BusinessesDAL(db)
#         businesses = businesses_dal.get_businesses()
#         return jsonify(businesses)
#     except Exception as e:
#         logging.error(f"Unexpected error: {str(e)}")
#         return jsonify({"error": "An unexpected error occurred"}), 500
#
#
# @bp.route('/<business_id>')
# def get_business(business_id):
#     try:
#         db = get_db()
#         businesses_dal = BusinessesDAL(db)
#         business = businesses_dal.get_business(business_id)
#
#         if business:
#             return jsonify(business)
#         else:
#             return jsonify({"error": "Business not found"}), 404
#     except Exception as e:
#         logging.error(f"Unexpected error: {str(e)}")
#         return jsonify({"error": "An unexpected error occurred"}), 500

from flask import Blueprint, jsonify, request
import logging
from dal.businesses_dal import BusinessesDAL
from dal.auth_dal import AuthDAL
from services.database import get_db

bp = Blueprint('businesses', __name__, url_prefix='/api/businesses')


@bp.route('/')
def get_businesses():
    try:
        db = get_db()
        auth_dal = AuthDAL(db)
        businesses_dal = BusinessesDAL(db)

        # Get the token from the Authorization header
        token = request.headers.get('authToken')
        if not token:
            return jsonify({"error": "No token provided"}), 401

        # Validate the token and get the user ID
        user_id = auth_dal.validate_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Get the businesses for the user
        businesses = businesses_dal.get_businesses_for_user(user_id)
        return jsonify(businesses)
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@bp.route('/<business_id>')
def get_business(business_id):
    try:
        db = get_db()
        auth_dal = AuthDAL(db)
        businesses_dal = BusinessesDAL(db)

        # Get the token from the Authorization header
        token = request.headers.get('authToken')
        if not token:
            return jsonify({"error": "No token provided"}), 401

        # Validate the token and get the user ID
        user_id = auth_dal.validate_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Check if the user has access to this business
        if not businesses_dal.user_has_access_to_business(user_id, business_id):
            return jsonify({"error": "Access denied"}), 403

        business = businesses_dal.get_business(business_id)

        if business:
            return jsonify(business)
        else:
            return jsonify({"error": "Business not found"}), 404
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500