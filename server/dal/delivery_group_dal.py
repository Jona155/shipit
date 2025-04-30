# dal/delivery_group_dal.py
import uuid
from datetime import datetime
import logging # Added logging

class DeliveryGroupDAL:
    def __init__(self, db):
        self.db = db

    def create_delivery_group(self, bid, courier_uid, courier_name, order_ids, source_bids):
        """
        Create a new delivery group document in the delivery_groups collection.
        Includes the source_bid field containing original business IDs of the orders.
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
            "courier_name": courier_name,
            "bid": bid, # The BID of the business creating the group (e.g., the vendor)
            "status": "ASSIGNED",
            "timestamp": datetime.utcnow(),
            "abortedOrders": [],
            "route": route_items,
            "source_bid": source_bids # Store the list of original BIDs
        }
        
        logging.info(f"Creating delivery group: {delivery_group_doc}") # Log before insert
        self.db.delivery_groups.insert_one(delivery_group_doc)
        return delivery_group_doc

    def get_assigned_delivery_groups(self, bid):
        """
        Fetch all delivery groups with status 'ASSIGNED' where the group's
        bid matches OR the requesting bid is included in the source_bid array.
        """
        query = {
            "status": "ASSIGNED",
            "$or": [
                { "bid": bid },           # Group created by this business
                { "source_bid": bid }     # Group contains orders from this business
            ]
        }
        logging.info(f"Querying assigned delivery groups for bid {bid}: {query}")
        return list(self.db.delivery_groups.find(query))
