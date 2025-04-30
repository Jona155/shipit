# delivery_group.py
from flask import Blueprint, request, jsonify
from services.database import get_db
import logging
from dal.users_dal import UsersDAL
from dal.orders_dal import OrdersDAL
from dal.delivery_group_dal import DeliveryGroupDAL
from bson import ObjectId
from datetime import datetime

bp = Blueprint('delivery_group', __name__, url_prefix='/api/delivery-group')

@bp.route('/assign', methods=['POST'])
def assign_courier_to_orders():
    """
    Receives:
    {
      "courier_uid": "<courier UID>",
      "order_ids": ["<id1>", "<id2>", ...]
    }
    1) Sets user_businesses.profiles.messenger.isWhileMission to true
    2) Updates each order's status array so that "ASSIGNED" is at index 0 and updates the courier_name field.
    3) Creates a new document in the delivery_groups collection, including source_bid list.
    """
    try:
        db = get_db()
        users_dal = UsersDAL(db)
        orders_dal = OrdersDAL(db)
        delivery_group_dal = DeliveryGroupDAL(db)

        data = request.json
        courier_uid = data.get('courier_uid')
        order_ids = data.get('order_ids', [])
        assigning_business_id = data.get('businessId') # Get the BID of the business performing the assignment

        logging.info(f"Assign courier request: courier={courier_uid}, orders={order_ids}, assigning_bid={assigning_business_id}")

        if not courier_uid or not order_ids or not assigning_business_id:
            return jsonify({"error": "Missing courier_uid, order_ids, or businessId"}), 400

        # --- Get Source BIDs --- 
        assigned_orders = orders_dal.get_orders_by_ids(order_ids)
        if not assigned_orders:
            logging.error(f"Could not find any orders for IDs: {order_ids}")
            return jsonify({"error": "Assigned orders not found"}), 404
            
        source_bids_set = set()
        for order in assigned_orders:
            # Prioritize source_bid if it exists (for vendor orders), otherwise use the order's bid
            source_bid = order.get('source_bid', order.get('bid')) 
            if source_bid:
                source_bids_set.add(source_bid)
            else:
                logging.warning(f"Order {order.get('_id')} missing both source_bid and bid field.")
                
        source_bids_list = list(source_bids_set)
        logging.info(f"Extracted source BIDs for delivery group: {source_bids_list}")
        # --- End Get Source BIDs ---

        # 1) Update the courier's status 
        db.user_businesses.update_one(
            {"uid": courier_uid},
            {"$set": {
                "profiles.messenger.isWhileMission": True,
                "profiles.messenger.isCurrentlyAvailable": False,
                "profiles.messenger.lastNonAvailableTimestamp": datetime.utcnow()
            }}
        )

        # Retrieve the courier's name
        courier_user = db.users.find_one({"_id": courier_uid})
        courier_name = courier_user.get('name') if courier_user else None

        # 2) Update each selected order status
        new_status = "ASSIGNED"
        updated_orders = orders_dal.update_orders_status(
            order_ids=order_ids,
            new_status=new_status,
            courier_id=courier_uid,
            courier_name=courier_name,
        )

        # 3) Create a new Delivery Group, passing the source_bids list
        delivery_group_doc = delivery_group_dal.create_delivery_group(
            bid=assigning_business_id, # The BID of the business assigning the courier
            courier_uid=courier_uid,
            courier_name=courier_name,
            order_ids=order_ids,
            source_bids=source_bids_list # Pass the extracted source BIDs
        )

        return jsonify({
            "message": "Courier assigned successfully",
            "updated_orders": updated_orders,
            "delivery_group": delivery_group_doc
        }), 200

    except Exception as e:
        logging.error(f"Error in assign_courier_to_orders: {str(e)}")
        import traceback
        logging.error(traceback.format_exc()) # Log full traceback
        return jsonify({"error": str(e)}), 500


@bp.route('/assigned', methods=['GET'])
def get_assigned_delivery_groups():
    """
    Endpoint to fetch all delivery groups with status 'ASSIGNED' for a given business.
    The business id (bid) is passed as a query parameter.
    """
    try:
        db = get_db()
        bid = request.args.get("bid")
        if not bid:
            return jsonify({"error": "Missing bid"}), 400
        delivery_group_dal = DeliveryGroupDAL(db)
        groups = delivery_group_dal.get_assigned_delivery_groups(bid)
        # Convert datetime fields to ISO format
        for group in groups:
            if 'timestamp' in group:
                group['timestamp'] = group['timestamp'].isoformat()
        return jsonify(groups), 200
    except Exception as e:
        logging.error(f"Error in get_assigned_delivery_groups: {str(e)}")
        return jsonify({"error": str(e)}), 500


@bp.route('/finish', methods=['POST'])
def finish_delivery_group():
    """
    Finishes a delivery group row:
    - Updates the delivery group status to "FINISHED"
    - Updates all orders in its route to status "DELIVERED"
    - Resets courier's availability status

    Expects JSON:
    {
       "delivery_group_id": "<delivery_group_id>"
    }
    """
    try:
        db = get_db()
        data = request.json
        dg_id = data.get("delivery_group_id")
        if not dg_id:
            return jsonify({"error": "Missing delivery_group_id"}), 400

        # Retrieve the delivery group document to get order IDs and courier ID
        dg = db.delivery_groups.find_one({"_id": dg_id})
        if not dg:
            return jsonify({"error": "Delivery group not found"}), 404

        # Update the delivery group status to FINISHED
        result = db.delivery_groups.update_one({"_id": dg_id}, {"$set": {"status": "FINISHED"}})
        if result.modified_count == 0:
            return jsonify({"error": "Delivery group not found or already finished"}), 404

        order_ids = [item["orderId"] for item in dg.get("route", [])]
        courier_uid = dg.get("messengerId")

        # Update orders to DELIVERED status
        db.orders.update_many(
            {"_id": {"$in": order_ids}},
            {
                "$push": {"status": {"$each": [{"value": "DELIVERED", "timestamp": datetime.utcnow()}], "$position": 0}}
            }
        )

        # Reset courier's status - set isWhileMission to false and isCurrentlyAvailable to true
        if courier_uid:
            db.user_businesses.update_one(
                {"uid": courier_uid},
                {"$set": {
                    "profiles.messenger.isWhileMission": False,
                    "profiles.messenger.isCurrentlyAvailable": True,
                    "profiles.messenger.lastAvailableTimestamp": datetime.utcnow()
                }}
            )

        return jsonify({"message": "Delivery group finished", "delivery_group_id": dg_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/abort', methods=['POST'])
def abort_delivery_group():
    """
    Aborts a delivery group assignment:
    - Updates the delivery group status to "ABORTED"
    - Updates all orders in its route to status "ACCEPTED"
    - Resets courier's availability status

    Expects JSON:
    {
       "delivery_group_id": "<delivery_group_id>",
       "business_id": "<business_id>" 
    }
    
    Security: Only the business that owns the delivery group (matching bid) can abort it
    """
    try:
        db = get_db()
        data = request.json
        dg_id = data.get("delivery_group_id")
        business_id = data.get("business_id")
        
        if not dg_id:
            return jsonify({"error": "Missing delivery_group_id"}), 400
            
        if not business_id:
            return jsonify({"error": "Missing business_id"}), 400

        # Retrieve the delivery group document to get order IDs and courier ID
        dg = db.delivery_groups.find_one({"_id": dg_id})
        if not dg:
            return jsonify({"error": "Delivery group not found"}), 404
            
        # Security check: Verify that the requesting business owns this delivery group
        if dg.get("bid") != business_id:
            logging.warning(f"Security: Unauthorized abort attempt for delivery group {dg_id} by business {business_id}")
            return jsonify({"error": "You can only abort delivery groups that belong to your business"}), 403

        # Update the delivery group status to ABORTED
        result = db.delivery_groups.update_one({"_id": dg_id}, {"$set": {"status": "ABORTED"}})
        if result.modified_count == 0:
            return jsonify({"error": "Delivery group not found or already aborted"}), 404

        order_ids = [item["orderId"] for item in dg.get("route", [])]
        courier_uid = dg.get("messengerId")

        # Update orders to ACCEPTED status and remove courier info
        db.orders.update_many(
            {"_id": {"$in": order_ids}},
            {
                "$push": {"status": {"$each": [{"value": "ACCEPTED", "timestamp": datetime.utcnow()}], "$position": 0}},
                "$set": {"courier_id": None, "courier_name": None}
            }
        )

        # Reset courier's status - set isWhileMission to false and isCurrentlyAvailable to true
        if courier_uid:
            db.user_businesses.update_one(
                {"uid": courier_uid},
                {"$set": {
                    "profiles.messenger.isWhileMission": False,
                    "profiles.messenger.isCurrentlyAvailable": True,
                    "profiles.messenger.lastAvailableTimestamp": datetime.utcnow()
                }}
            )

        return jsonify({"message": "Delivery group aborted", "delivery_group_id": dg_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
