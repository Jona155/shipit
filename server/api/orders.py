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