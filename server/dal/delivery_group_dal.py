# dal/delivery_group_dal.py
import uuid
from datetime import datetime

class DeliveryGroupDAL:
    def __init__(self, db):
        self.db = db

    def create_delivery_group(self, bid, courier_uid, courier_name, order_ids):
        """
        Create a new delivery group document in the delivery_groups collection.
        The route is built from the provided order_ids. Duration fields default to 0.
        """
        route_items = []
        for oid in order_ids:
            route_items.append({
                "orderId": oid,
                "duration": 0,
                "durationFromNow": 0,
                "orderDuration": 0
            })

        delivery_group_doc = {
            "_id": str(uuid.uuid4()),
            "duration": 0,
            "durationFromNow": 0,
            "orderDuration": 0,
            "messengerId": courier_uid,
            "courier_name": courier_name,  # New field to store courier name
            "bid": bid,
            "status": "ASSIGNED",
            "timestamp": datetime.utcnow(),
            "abortedOrders": [],
            "route": route_items
        }

        self.db.delivery_groups.insert_one(delivery_group_doc)
        return delivery_group_doc

    def get_assigned_delivery_groups(self, bid):
        """
        Fetch all delivery groups with status 'ASSIGNED' for the given business id.
        """
        return list(self.db.delivery_groups.find({
            "bid": bid,
            "status": "ASSIGNED"
        }))
