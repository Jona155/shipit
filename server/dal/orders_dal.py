from datetime import datetime

class OrdersDAL:
    def __init__(self, db):
        self.db = db

    def get_business_orders(self, business_id, status='all'):
        pipeline = [
            {"$match": {"bid": business_id, "isDeleted": {"$ne": True}}},
            {"$addFields": {
                "latest_status": {"$arrayElemAt": ["$status.value", 0]},
                "latest_status_date": {"$dateToString": {"format": "%Y-%m-%d", "date": {"$arrayElemAt": ["$status.timestamp", 0]}}}
            }}
        ]

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

        for order in orders:
            order['_id'] = str(order['_id'])
            for status in order['status']:
                status['timestamp'] = status['timestamp'].isoformat()
            order['timestamp'] = order['timestamp'].isoformat()
            order['order_time'] = order['order_time'].isoformat()
            
            # Handle nested date objects in payment_methods if they exist
            if 'payment_methods' in order:
                for payment in order['payment_methods']:
                    if 'timestamp' in payment and isinstance(payment['timestamp'], datetime):
                        payment['timestamp'] = payment['timestamp'].isoformat()

        return orders

    from datetime import datetime

    class OrdersDAL:
        def __init__(self, db):
            self.db = db

    def update_orders_status(self, order_ids, new_status, courier_id=None, courier_name=None):
            update_data = {
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

            # Add both courier_id and courier_name to the update if ASSIGNED
            if new_status == "ASSIGNED" and courier_id and courier_name:
                update_data["$set"] = {
                    "courier_id": courier_id,
                    "courier_name": courier_name  # Ensure courier_name is updated
                }

            # Update the orders in the database
            self.db.orders.update_many(
                {"_id": {"$in": order_ids}},
                update_data
            )

            # Fetch the updated orders and convert the data to dicts for the response
            updated_orders = list(self.db.orders.find({"_id": {"$in": order_ids}}))

            for order in updated_orders:
                order['_id'] = str(order['_id'])
                for status in order['status']:
                    status['timestamp'] = status['timestamp'].isoformat()
                order['timestamp'] = order['timestamp'].isoformat()
                order['order_time'] = order['order_time'].isoformat()

            return updated_orders
