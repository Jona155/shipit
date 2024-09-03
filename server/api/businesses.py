from flask import Blueprint, jsonify
from services.database import get_db
from bson import json_util
import json
import logging
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

bp = Blueprint('businesses', __name__, url_prefix='/api/businesses')

@bp.route('/')
def get_businesses():
    try:
        db = get_db()
        businesses = list(db.businesses.find(
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
        
        return jsonify(businesses)
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logging.error(f"Database connection error: {str(e)}")
        return jsonify({"error": "Database connection error"}), 500
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@bp.route('/<business_id>')
def get_business(business_id):
    try:
        db = get_db()
        business = db.businesses.find_one({"_id": business_id})
        
        if business:
            # Convert the MongoDB document to a JSON-serializable format
            business_json = json.loads(json_util.dumps(business))
            return jsonify(business_json)
        else:
            return jsonify({"error": "Business not found"}), 404
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logging.error(f"Database connection error: {str(e)}")
        return jsonify({"error": "Database connection error"}), 500
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500