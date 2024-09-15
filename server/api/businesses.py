from flask import Blueprint, jsonify
from services.database import get_db
import logging
from dal.businesses_dal import BusinessesDAL

bp = Blueprint('businesses', __name__, url_prefix='/api/businesses')

@bp.route('/')
def get_businesses():
    try:
        db = get_db()
        businesses_dal = BusinessesDAL(db)
        businesses = businesses_dal.get_businesses()
        return jsonify(businesses)
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@bp.route('/<business_id>')
def get_business(business_id):
    try:
        db = get_db()
        businesses_dal = BusinessesDAL(db)
        business = businesses_dal.get_business(business_id)
        
        if business:
            return jsonify(business)
        else:
            return jsonify({"error": "Business not found"}), 404
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500