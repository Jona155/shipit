from flask import Blueprint, jsonify, request
from services.database import get_db
import logging
from dal.orders_dal import OrdersDAL

bp = Blueprint('orders', __name__, url_prefix='/api/orders')

@bp.route('/business/<business_id>')
def get_business_orders(business_id):
    try:
        db = get_db()
        orders_dal = OrdersDAL(db)
        status = request.args.get('status', 'all')
        
        orders = orders_dal.get_business_orders(business_id, status)
        return jsonify(orders), 200

    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
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