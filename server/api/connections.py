# connections.py
# New endpoint to fetch active vendor connections for a given restaurant.
# The endpoint retrieves all connections for the specified business and enriches
# each with vendor details from the businesses collection.
from flask import Blueprint, jsonify, request
from services.database import get_db
import logging
from dal.connections_dal import ConnectionsDAL  # Data Access Layer for connections
from dal.businesses_dal import BusinessesDAL  # To fetch vendor details

bp = Blueprint('connections', __name__, url_prefix='/api/connections')


@bp.route('/business/<business_id>', methods=['GET'])
def get_business_connections(business_id):
    try:
        db = get_db()
        connections_dal = ConnectionsDAL(db)
        businesses_dal = BusinessesDAL(db)

        connections = connections_dal.get_connections_for_business(business_id)
        enriched_connections = []
        # Enrich each active connection with vendor name
        for conn in connections:
            if conn.get('status') == 'active':
                vendor = businesses_dal.get_business(conn['vendor_id'])
                if vendor:
                    conn['vendor_name'] = vendor.get('name')
                enriched_connections.append(conn)

        return jsonify(enriched_connections), 200
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500
