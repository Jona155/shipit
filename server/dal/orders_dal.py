# orders_dal.py
from datetime import datetime

class OrdersDAL:
    def __init__(self, db):
# I want this query to return all orders from type "ACCEPTED", "READY", "ASSIGNED", "COLLECTED" but only orders from the last day if their status is "Finished"
        self.db = db
    def get_business_orders(self, business_id, status='all'):
        # First, check if the requesting business is a vendor.
        business = self.db.businesses.find_one({"_id": business_id})
        is_vendor = business and business.get("business_type") == "vendor"

        if is_vendor:
            # For a vendor, match orders where:
            # - third_party is true, and
            # - sent_to_3rd_party equals the vendor's name.
            match_criteria = {
                "third_party": True,
                "sent_to_3rd_party": business.get("_id")
            }
        else:
            # For a restaurant (or non‑vendor), match orders with bid equal to the business_id.
            match_criteria = {
                "bid": business_id            }

        pipeline = [
            {"$match": match_criteria},
            {"$addFields": {
                "latest_status": {"$arrayElemAt": ["$status.value", 0]},
                "latest_status_date": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": {"$arrayElemAt": ["$status.timestamp", 0]}
                    }
                }
            }}
        ]

        # If vendor, perform a $lookup to bring in the restaurant details.
        if is_vendor:
            pipeline.extend([
                {"$lookup": {
                    "from": "businesses",
                    "localField": "bid",
                    "foreignField": "_id",
                    "as": "restaurant_info"
                }},
                {"$unwind": "$restaurant_info"},
                {"$addFields": {
                    "sent_from": "$restaurant_info.name"
                }}
            ])

        if status == 'accepted':
            pipeline.append({"$match": {"latest_status": "ACCEPTED"}})
        elif status == 'on_their_way':
            pipeline.append({"$match": {"latest_status": {"$in": ["ASSIGNED", "COLLECTED"]}}})
        elif status == 'finished':
            today = datetime.now().strftime("%Y-%m-%d")
            pipeline.extend([
                {"$match": {"latest_status": "DELIVERED"}},
                {"$match": {"latest_status_date": today}}
            ])

        pipeline.append({"$sort": {"status.0.timestamp": -1}})

        orders = list(self.db.orders.aggregate(pipeline))

        # Format dates for each order.
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
        # Prepare the fields to update
        update_fields = {
            "courier_id": courier_id,
            "courier_name": courier_name,
            "third_party": third_party,
        }
        # If this is a third party assignment, update the sent_to_3rd_party field with the vendor's id
        if third_party:
            update_fields["sent_to_3rd_party"] = courier_id
        else:
            # Optionally, you could clear the sent_to_3rd_party field for non-third-party orders
            update_fields["sent_to_3rd_party"] = None
        # Validate the new status to be one of the following: 'ACCEPTED', 'READY', ASSIGNED', 'COLLECTED', 'FINISHED'
        update_data = {
            "$set": update_fields,
            "$push": {
                "status": {
                    "$each": [{
                        "value": new_status,
                        "timestamp": datetime.utcnow()
                    }],
                    "$position": 0  # Insert at the beginning so it becomes the latest status
                }
            }
        }

        # Update all orders matching the given order_ids.
        self.db.orders.update_many({"_id": {"$in": order_ids}}, update_data)

        # Retrieve and return the updated orders.
        updated_orders = list(self.db.orders.find({"_id": {"$in": order_ids}}))
        for order in updated_orders:
            order['_id'] = str(order['_id'])
            for s in order.get('status', []):
                if hasattr(s.get('timestamp'), 'isoformat'):
                    s['timestamp'] = s['timestamp'].isoformat()
        return updated_orders