# orders.py
import uuid

from flask import Blueprint, jsonify, request
from services.database import get_db
import logging
from dal.orders_dal import OrdersDAL
from dal.auth_dal import AuthDAL

bp = Blueprint('orders', __name__, url_prefix='/api/orders')

@bp.route('/business/<business_id>')
def get_business_orders(business_id):
    try:
        db = get_db()
        orders_dal = OrdersDAL(db)
        status = request.args.get('status', 'all')
        since = request.args.get('since')  # New query parameter for incremental fetch
        orders = orders_dal.get_business_orders(business_id, status, since)
        return jsonify(orders), 200
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@bp.route('/assign', methods=['POST'])
def assign_courier():
    try:
        db = get_db()
        orders_dal = OrdersDAL(db)
        data = request.json
        logging.info(f"Assign courier request data: {data}")
        
        order_ids = data.get('orderIds', [])
        courier_id = data.get('courierId')
        courier_name = data.get('courierName', 'Unknown Courier')  # Get name directly from frontend
        business_id = data.get('businessId')
        
        logging.info(f"Assigning courier ID={courier_id}, Name={courier_name}")

        if not order_ids or not courier_id:
            logging.error("Missing order_ids or courier_id in request")
            return jsonify({"error": "Missing order_ids or courier_id"}), 400
        
        # Update the orders with the ASSIGNED status using courier info directly
        updated_orders = orders_dal.update_orders_status(order_ids, "ASSIGNED", courier_id, courier_name, False)
        logging.info(f"Updated {len(updated_orders)} orders")
        
        return jsonify(updated_orders), 200
    except Exception as e:
        logging.error(f"Error assigning courier: {str(e)}")
        import traceback
        logging.error(traceback.format_exc())
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@bp.route('/update-status', methods=['PUT', 'POST'])
def update_order_status():
    try:
        db = get_db()
        orders_dal = OrdersDAL(db)
        data = request.json
        order_ids = data.get('order_ids', [])
        new_status = data.get('status')
        courier_id = data.get('courier_id')
        courier_name = data.get('courier_name')
        third_party = data.get('third_party', False)

        if not order_ids or not new_status:
            return jsonify({"error": "Missing order_ids or status"}), 400

        if new_status not in ["ACCEPTED", "READY", "ASSIGNED", "COLLECTED", "DELIVERED"]:
            return jsonify({"error": "Invalid status"}), 400

        updated_orders = orders_dal.update_orders_status(order_ids, new_status, courier_id, courier_name, third_party)
        return jsonify({"message": "Orders updated successfully", "updated_orders": updated_orders}), 200
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@bp.route('/tender', methods=['POST'])
def send_to_tender():
    """
    Send an order to tender by creating a tender_scope array with selected vendors.
    
    Expects JSON:
    {
        "order_id": "order_id",
        "vendor_ids": ["vendor_id1", "vendor_id2", ...]
    }
    """
    try:
        db = get_db()
        orders_dal = OrdersDAL(db)
        auth_dal = AuthDAL(db)
        
        # Get the token from the request header
        token = request.headers.get('authToken')
        if not token:
            return jsonify({"error": "No token provided"}), 401
            
        # Validate the token and get the user ID
        user_id = auth_dal.validate_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
            
        data = request.json
        
        order_id = data.get('order_id')
        vendor_ids = data.get('vendor_ids', [])
        
        if not order_id or not vendor_ids:
            return jsonify({"error": "Missing order_id or vendor_ids"}), 400
        
        # Create tender scope entries for each vendor
        tender_scope = []
        for vendor_id in vendor_ids:
            tender_scope.append({
                "tender_bid": vendor_id,
                "status": "PENDING"
            })
        
        # Update the order with tender information
        updated_order = orders_dal.send_to_tender(order_id, tender_scope)
        
        if not updated_order:
            return jsonify({"error": "Order not found or cannot be sent to tender"}), 404
            
        return jsonify({
            "message": f"Tender sent to {len(vendor_ids)} vendors", 
            "updated_order": updated_order
        }), 200
    except Exception as e:
        logging.error(f"Error sending order to tender: {str(e)}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# server/api/orders.py
@bp.route('', methods=['POST'])
def create_order():
    try:
        db = get_db()
        orders_dal = OrdersDAL(db)
        data = request.json

        # Add required fields
        data['_id'] = str(uuid.uuid4())

        # Insert the order
        result = orders_dal.create_order(data)
        return jsonify(result), 201
    except Exception as e:
        logging.error(f"Error creating order: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Debug endpoint to help troubleshoot courier lookup
@bp.route('/debug/courier/<courier_id>', methods=['GET'])
def debug_courier_lookup(courier_id):
    try:
        db = get_db()
        logging.info(f"Debugging courier lookup for id: {courier_id}")
        
        # Check in users collection by _id
        courier_by_id = db.users.find_one({"_id": courier_id})
        
        # Check in users collection by uid
        courier_by_uid = db.users.find_one({"uid": courier_id})
        
        # Check if it's in the business_users collection
        business_user = db.business_users.find_one({"user_id": courier_id})
        
        # Get a sample of users
        sample_users = list(db.users.find().limit(5))
        sample_users_data = [{k: v for k, v in u.items() if k in ['_id', 'uid', 'name']} for u in sample_users]
        
        return jsonify({
            "courier_id": courier_id,
            "found_by_id": courier_by_id is not None,
            "found_by_uid": courier_by_uid is not None,
            "found_in_business_users": business_user is not None,
            "courier_by_id": {k: v for k, v in courier_by_id.items() if k in ['_id', 'uid', 'name']} if courier_by_id else None,
            "courier_by_uid": {k: v for k, v in courier_by_uid.items() if k in ['_id', 'uid', 'name']} if courier_by_uid else None,
            "business_user": business_user,
            "sample_users": sample_users_data
        }), 200
    except Exception as e:
        logging.error(f"Error in debug endpoint: {str(e)}")
        import traceback
        logging.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500