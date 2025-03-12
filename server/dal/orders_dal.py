# orders_dal.py
from datetime import datetime, timedelta

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

        pipeline = [
            {"$match": match_criteria},
            {"$addFields": {
                "latest_status": {"$arrayElemAt": ["$status.value", 0]}
            }}
        ]

        # Apply incremental fetch filter if 'since' is provided
        if since:
            try:
                since_dt = datetime.fromisoformat(since)
                pipeline.append({"$match": {"status.0.timestamp": {"$gt": since_dt}}})
            except ValueError:
                pass

        if status == 'accepted':
            pipeline.append({"$match": {"latest_status": "ACCEPTED"}})
        elif status == 'on_their_way':
            pipeline.append({"$match": {"latest_status": {"$in": ["ASSIGNED", "COLLECTED"]}}})
        elif status == 'finished':
            cutoff = datetime.utcnow() - timedelta(hours=24)
            pipeline.extend([
                {"$match": {"latest_status": "DELIVERED"}},
                {"$match": {"status.0.timestamp": {"$gte": cutoff}}}
            ])

        pipeline.append({"$sort": {"status.0.timestamp": -1}})

        orders = list(self.db.orders.aggregate(pipeline))

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
        update_fields = {
            "courier_id": courier_id,
            "courier_name": courier_name,
            "third_party": third_party,
        }
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

        self.db.orders.update_many({"_id": {"$in": order_ids}}, update_data)
        updated_orders = list(self.db.orders.find({"_id": {"$in": order_ids}}))
        for order in updated_orders:
            order['_id'] = str(order['_id'])
            for s in order.get('status', []):
                if hasattr(s.get('timestamp'), 'isoformat'):
                    s['timestamp'] = s['timestamp'].isoformat()
        return updated_orders
