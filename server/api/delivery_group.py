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
    3) Creates a new document in the delivery_groups collection.
    """
    try:
        db = get_db()
        users_dal = UsersDAL(db)
        orders_dal = OrdersDAL(db)
        delivery_group_dal = DeliveryGroupDAL(db)

        data = request.json
        courier_uid = data.get('courier_uid')
        order_ids = data.get('order_ids', [])

        if not courier_uid or not order_ids:
            return jsonify({"error": "Missing courier_uid or order_ids"}), 400

        # 1) Update the courier's status - set isWhileMission to true and isCurrentlyAvailable to false
        db.user_businesses.update_one(
            {"uid": courier_uid},
            {"$set": {
                "profiles.messenger.isWhileMission": True,
                "profiles.messenger.isCurrentlyAvailable": False,
                "profiles.messenger.lastNonAvailableTimestamp": datetime.utcnow()
            }}
        )

        # Retrieve the courier's name from the users collection
        courier_user = db.users.find_one({"_id": courier_uid})
        courier_name = courier_user.get('name') if courier_user else None

        # 2) Update each selected order: set status to "ASSIGNED" and update courier_name.
        new_status = "ASSIGNED"
        updated_orders = orders_dal.update_orders_status(
            order_ids=order_ids,
            new_status=new_status,
            courier_id=courier_uid,
            courier_name=courier_name,  # now passing the retrieved courier name
            third_party=False  # assume in-house for now
        )

        # Retrieve business id from the user_businesses document:
        user_business = db.user_businesses.find_one({"uid": courier_uid})
        if not user_business:
            return jsonify({"error": "No user_businesses entry found for courier"}), 404

        bid = user_business.get('bid', '')

        # 3) Create a new Delivery Group, passing the courier_name.
        delivery_group_doc = delivery_group_dal.create_delivery_group(
            bid=bid,
            courier_uid=courier_uid,
            courier_name=courier_name,
            order_ids=order_ids
        )

        return jsonify({
            "message": "Courier assigned successfully",
            "updated_orders": updated_orders,
            "delivery_group": delivery_group_doc
        }), 200

    except Exception as e:
        logging.error(f"Error in assign_courier_to_orders: {str(e)}")
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
                "$push": {"status": {"$each": [{"value": "DELIVERED", "timestamp": datetime.utcnow()}], "$position": 0}},
                "$set": {"latest_status": "DELIVERED"}
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

        # Update the delivery group status to ABORTED
        result = db.delivery_groups.update_one({"_id": dg_id}, {"$set": {"status": "ABORTED"}})
        if result.modified_count == 0:
            return jsonify({"error": "Delivery group not found or already aborted"}), 404

        order_ids = [item["orderId"] for item in dg.get("route", [])]
        courier_uid = dg.get("messengerId")

        # Update orders to ACCEPTED status
        db.orders.update_many(
            {"_id": {"$in": order_ids}},
            {
                "$push": {"status": {"$each": [{"value": "ACCEPTED", "timestamp": datetime.utcnow()}], "$position": 0}},
                "$set": {"latest_status": "ACCEPTED", "courier_id": None, "courier_name": None}
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
