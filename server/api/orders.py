# orders.py
import uuid
from datetime import datetime, timedelta

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

        if not order_ids or not new_status:
            return jsonify({"error": "Missing order_ids or status"}), 400

        if new_status not in ["ACCEPTED", "READY", "ASSIGNED", "COLLECTED", "DELIVERED"]:
            return jsonify({"error": "Invalid status"}), 400

        updated_orders = orders_dal.update_orders_status(order_ids, new_status, courier_id, courier_name)
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

@bp.route('/cancel-tender', methods=['POST'])
def cancel_order_tender():
    """
    Cancel the tender process for a specific order.
    
    Expects JSON:
    {
        "order_id": "order_id"
    }
    """
    try:
        db = get_db()
        orders_dal = OrdersDAL(db)
        auth_dal = AuthDAL(db)
        
        # Token validation (similar to send_to_tender)
        token = request.headers.get('authToken')
        if not token:
            return jsonify({"error": "No token provided"}), 401
        user_id = auth_dal.validate_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
            
        data = request.json
        order_id = data.get('order_id')
        
        if not order_id:
            return jsonify({"error": "Missing order_id"}), 400
            
        # Call the DAL method to cancel tender
        updated_order = orders_dal.cancel_tender(order_id)
        
        if not updated_order:
            return jsonify({"error": "Order not found"}), 404
            
        return jsonify({
            "message": "Tender cancelled successfully", 
            "updated_order": updated_order
        }), 200
    except Exception as e:
        logging.error(f"Error cancelling tender: {str(e)}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@bp.route('/tender-response', methods=['POST'])
def handle_tender_response():
    """
    Allows a vendor to approve or disapprove a tender offer.
    Expects JSON:
    {
        "order_id": "order_id",
        "vendor_id": "vendor_id",  // The ID of the vendor responding
        "response_status": "APPROVED" | "DISAPPROVED"
    }
    """
    try:
        db = get_db()
        orders_dal = OrdersDAL(db)
        auth_dal = AuthDAL(db)
        
        # Basic Token validation - Consider adding role/permission check for vendors
        token = request.headers.get('authToken')
        if not token:
            return jsonify({"error": "No token provided"}), 401
        user_id = auth_dal.validate_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
            
        data = request.json
        order_id = data.get('order_id')
        vendor_id = data.get('vendor_id') # Make sure the frontend sends the vendor's business ID
        response_status = data.get('response_status')
        
        # Validate input
        if not all([order_id, vendor_id, response_status]):
            return jsonify({"error": "Missing order_id, vendor_id, or response_status"}), 400
            
        if response_status not in ["APPROVED", "DISAPPROVED"]:
             return jsonify({"error": "Invalid response_status"}), 400
        
        # TODO: Add check: ensure vendor_id matches the authenticated user/business if applicable
             
        # Call the DAL method to update the tender status
        updated_order = orders_dal.update_tender_status(order_id, vendor_id, response_status)
        
        if not updated_order:
            # DAL method handles logging, return appropriate error
            return jsonify({"error": "Failed to update tender status. Order or vendor scope might not exist."}), 404 
            
        return jsonify({
            "message": f"Tender status updated to {response_status}", 
            "updated_order": updated_order
        }), 200
        
    except Exception as e:
        logging.error(f"Error handling tender response: {str(e)}")
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

@bp.route('/vendor/<vendor_id>')
def get_vendor_orders(vendor_id):
    """Fetches orders relevant to a vendor based on tender_scope."""
    # Debug log to verify route is being hit
    logging.info(f"GET /vendor/{vendor_id} route called, processing request...")
    try:
        db = get_db()
        orders_dal = OrdersDAL(db)
        status = request.args.get('status', 'all')
        since = request.args.get('since')
        # TODO: Add authentication/authorization check if needed for vendors
        
        # Log the parameters
        logging.info(f"Fetching vendor orders with: vendor_id={vendor_id}, status={status}, since={since}")
        
        orders = orders_dal.get_vendor_orders(vendor_id, status, since)
        
        # Log success and order count
        logging.info(f"Successfully retrieved {len(orders)} orders for vendor {vendor_id}")
        
        return jsonify(orders), 200
    except Exception as e:
        # Enhanced error logging with traceback
        import traceback
        logging.error(f"Error fetching vendor orders: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# Add a new API route for selecting a vendor winner
@bp.route('/select-vendor', methods=['POST'])
def select_tender_winner():
    """
    Select a winning vendor for a tender.
    
    Expects JSON:
    {
        "order_id": "order_id",
        "selected_vendor": "vendor_bid_value"  // The vendor bid (name) selected as the winner
    }
    """
    try:
        db = get_db()
        orders_dal = OrdersDAL(db)
        auth_dal = AuthDAL(db)
        
        # Validate the token
        token = request.headers.get('authToken')
        if not token:
            return jsonify({"error": "No token provided"}), 401
            
        user_id = auth_dal.validate_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
            
        data = request.json
        
        order_id = data.get('order_id')
        selected_vendor = data.get('selected_vendor')
        
        if not order_id or selected_vendor is None:
            return jsonify({"error": "Missing order_id or selected_vendor"}), 400
            
        # Fetch the order to validate it exists and is in tender
        order = orders_dal.get_order(order_id)
        if not order:
            return jsonify({"error": "Order not found"}), 404
            
        if not order.get('in_tender'):
            return jsonify({"error": "Order is not in tender process"}), 400
            
        # Update the order with the selected vendor
        result = orders_dal.update_order(order_id, {
            "$set": {
                "selected_vendor": selected_vendor,
                "selected_at": datetime.utcnow()
            }
        })
        
        if not result:
            return jsonify({"error": "Failed to update order"}), 500
            
        # Fetch the updated order
        updated_order = orders_dal.get_order(order_id)
        if not updated_order:
            return jsonify({"error": "Failed to retrieve updated order"}), 500
            
        return jsonify({
            "message": "Vendor selected successfully",
            "updated_order": updated_order
        }), 200
        
    except Exception as e:
        logging.error(f"Error selecting tender winner: {str(e)}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# Diagnostic catchall route - will capture any unrecognized route under /api/orders
@bp.route('/<path:subpath>', methods=['GET'])
def catchall_route(subpath):
    """Diagnostic route to catch any unrecognized paths under /api/orders"""
    logging.warning(f"Unrecognized orders API route called: {subpath}")
    return jsonify({
        "error": f"Unrecognized route: /api/orders/{subpath}",
        "valid_routes": [
            "/api/orders/business/<business_id>",
            "/api/orders/vendor/<vendor_id>",
            "/api/orders/assign",
            "/api/orders/update-status",
            "/api/orders/tender",
            "/api/orders/cancel-tender",
            "/api/orders/tender-response",
            "/api/orders/select-vendor"
        ]
    }), 404