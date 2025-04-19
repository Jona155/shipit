# orders_dal.py
from datetime import datetime, timedelta
import dateutil.parser
import logging

class OrdersDAL:
    def __init__(self, db):
        self.db = db

    def get_business_orders(self, business_id, status='all', since=None):
        business = self.db.businesses.find_one({"_id": business_id})
        is_vendor = business and business.get("business_type") == "vendor"

        if is_vendor:
            match_criteria = {
                "third_party": True,
                "sent_to_3rd_party": business.get("_id")
            }
        else:
            match_criteria = {
                "bid": business_id
            }

        # Apply incremental fetch filter if 'since' is provided
        if since:
            try:
                since_dt = datetime.fromisoformat(since)
                match_criteria["status.0.timestamp"] = {"$gt": since_dt}
            except ValueError:
                pass

        # Filter by status using the first element in the status array
        if status == 'accepted':
            match_criteria["status.0.value"] = {"$in": ["READY", "ACCEPTED"]}
        elif status == 'on_their_way':
            match_criteria["status.0.value"] = {"$in": ["ASSIGNED", "COLLECTED"]}
        elif status == 'finished':
            cutoff = datetime.utcnow() - timedelta(hours=24)
            match_criteria["status.0.value"] = "DELIVERED"
            match_criteria["status.0.timestamp"] = {"$gte": cutoff}

        # Perform the query
        orders = list(self.db.orders.find(match_criteria).sort("status.0.timestamp", -1))

        for order in orders:
            order['_id'] = str(order['_id'])
            for s in order['status']:
                s['timestamp'] = s['timestamp'].isoformat()
            order['timestamp'] = order['timestamp'].isoformat()
            order['order_time'] = order['order_time'].isoformat()

            if 'payment_methods' in order:
                for payment in order['payment_methods']:
                    if 'timestamp' in payment and isinstance(payment['timestamp'], datetime):
                        payment['timestamp'] = payment['timestamp'].isoformat()

        return orders

    def update_orders_status(self, order_ids, new_status, courier_id, courier_name, third_party):
        logging.info(f"Updating order status: status={new_status}, courier={courier_id} ({courier_name})")
        
        update_fields = {}
        
        # Only set courier info if they're provided
        if courier_id:
            update_fields["courier_id"] = courier_id
            update_fields["courier_name"] = courier_name
            update_fields["third_party"] = third_party
            
            if third_party:
                update_fields["sent_to_3rd_party"] = courier_id
            else:
                update_fields["sent_to_3rd_party"] = None

        update_data = {
            "$set": update_fields,
            "$push": {
                "status": {
                    "$each": [{
                        "value": new_status,
                        "timestamp": datetime.utcnow()
                    }],
                    "$position": 0
                }
            }
        }
        
        # Add courier info to the status entry if available
        if courier_id:
            update_data["$push"]["status"]["$each"][0]["courier_id"] = courier_id
            update_data["$push"]["status"]["$each"][0]["courier_name"] = courier_name

        # Log the update details
        logging.info(f"Updating {len(order_ids)} orders with: {update_data}")
        
        result = self.db.orders.update_many({"_id": {"$in": order_ids}}, update_data)
        logging.info(f"Updated {result.modified_count} orders")
        
        updated_orders = list(self.db.orders.find({"_id": {"$in": order_ids}}))
        for order in updated_orders:
            order['_id'] = str(order['_id'])
            for s in order.get('status', []):
                if hasattr(s.get('timestamp'), 'isoformat'):
                    s['timestamp'] = s['timestamp'].isoformat()
        return updated_orders

    # Now add the create_order method:

    def create_order(self, order_data):
        """
        Insert a new order document, making sure any string timestamps
        are parsed into real datetimes so they're stored in Mongo as BSON Dates.
        """
        # Set default status to ACCEPTED if not provided
        if "status" not in order_data or not order_data["status"]:
            order_data["status"] = [{
                "value": "ACCEPTED",
                "timestamp": datetime.utcnow()
            }]
            
        # Convert top-level timestamps if they're strings
        if "timestamp" in order_data and isinstance(order_data["timestamp"], str):
            order_data["timestamp"] = dateutil.parser.parse(order_data["timestamp"])

        if "order_time" in order_data and isinstance(order_data["order_time"], str):
            order_data["order_time"] = dateutil.parser.parse(order_data["order_time"])

        # Convert timestamps in status array to datetimes if they're strings
        if "status" in order_data:
            for s in order_data["status"]:
                if "timestamp" in s and isinstance(s["timestamp"], str):
                    s["timestamp"] = dateutil.parser.parse(s["timestamp"])

        # Insert to Mongo; timestamps become real Date fields
        self.db.orders.insert_one(order_data)

        # Fetch newly created doc to return it in JSON
        created_order = self.db.orders.find_one({"_id": order_data["_id"]})

        # Convert _id and any date fields to JSON-friendly strings
        created_order["_id"] = str(created_order["_id"])

        # Convert status timestamps
        for s in created_order.get("status", []):
            ts = s.get('timestamp')
            if isinstance(ts, datetime):
                s['timestamp'] = ts.isoformat()

        # Convert top-level timestamps
        if isinstance(created_order.get("timestamp"), datetime):
            created_order["timestamp"] = created_order["timestamp"].isoformat()

        if isinstance(created_order.get("order_time"), datetime):
            created_order["order_time"] = created_order["order_time"].isoformat()

        return created_order