# orders_dal.py
from datetime import datetime, timedelta
import dateutil.parser
import logging
import uuid

class OrdersDAL:
    def __init__(self, db):
        self.db = db

    def get_business_orders(self, business_id, status='all', since=None):
        # Simplified match criteria, applies to all businesses
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

    def get_vendor_orders(self, vendor_id, status='all', since=None):
        """
        Fetches orders for a vendor based on their ID appearing in the tender_scope.
        Filters out orders where a different vendor has been selected as the winner.
        Applies status and incremental fetching similar to get_business_orders.
        """
        # Base criteria: vendor must be in scope AND (no winner selected OR this vendor is the winner)
        base_match = {
            "tender_scope": {
                "$elemMatch": {"tender_bid": vendor_id}
            },
            "$or": [
                {"selected_vendor": {"$exists": False}},
                {"selected_vendor": None},
                {"selected_vendor": vendor_id}
            ]
        }

        # Combine base criteria with status and incremental filters using $and
        all_conditions = [base_match]

        # Apply incremental fetch filter if 'since' is provided
        if since:
            try:
                # Use isoparse for better ISO 8601 handling
                since_dt = dateutil.parser.isoparse(since) 
                all_conditions.append({"status.0.timestamp": {"$gt": since_dt}})
            except ValueError:
                logging.warning(f"Invalid 'since' timestamp format received: {since}")
                pass # Ignore invalid 'since' format

        # Filter by status using the first element in the status array
        if status == 'accepted':
            # For vendors, 'accepted' means orders they can potentially act on
            # Base logic already ensures they only see relevant tenders
            all_conditions.append({"status.0.value": {"$in": ["IN_TENDER", "READY", "ACCEPTED"]}})
        elif status == 'on_their_way':
            # Base logic ensures only the selected vendor sees these
            all_conditions.append({"status.0.value": {"$in": ["ASSIGNED", "COLLECTED"]}})
        elif status == 'finished':
            # Base logic ensures only the selected vendor sees these
            cutoff = datetime.utcnow() - timedelta(hours=24)
            all_conditions.append({"status.0.value": "DELIVERED"})
            all_conditions.append({"status.0.timestamp": {"$gte": cutoff}})

        # Construct the final query
        final_query = {}
        if len(all_conditions) == 1:
            final_query = all_conditions[0]
        elif len(all_conditions) > 1:
            final_query = {"$and": all_conditions}
        else: 
            # Should not happen, but return empty list if no conditions
            return []

        # Perform the query
        logging.info(f"Executing vendor order query for {vendor_id}: {final_query}")
        orders = list(self.db.orders.find(final_query).sort("status.0.timestamp", -1))
        logging.info(f"Found {len(orders)} orders for vendor {vendor_id}")

        # Format orders (add my_tender_status, format dates)
        formatted_orders = []
        for order in orders:
            # Find the vendor's status within the tender_scope
            my_tender_status = "UNKNOWN" # Default
            tender_scope = order.get("tender_scope", [])
            if tender_scope: 
                for scope_item in tender_scope:
                     if isinstance(scope_item, dict):
                         if scope_item.get("tender_bid") == vendor_id:
                             my_tender_status = scope_item.get("status", "UNKNOWN")
                             break
                     else:
                          logging.warning(f"Unexpected item type in tender_scope for order {order.get('_id')}: {scope_item}")
            order['my_tender_status'] = my_tender_status
            
            # Format _id and timestamps
            order['_id'] = str(order['_id'])
            status_list = order.get('status', [])
            if isinstance(status_list, list):
                for s in status_list:
                    if isinstance(s, dict) and 'timestamp' in s and hasattr(s['timestamp'], 'isoformat'):
                         s['timestamp'] = s['timestamp'].isoformat()
            else:
                logging.warning(f"Order {order.get('_id')} has unexpected 'status' field type: {type(status_list)}")
            
            if 'timestamp' in order and hasattr(order.get('timestamp'), 'isoformat'):
                 order['timestamp'] = order['timestamp'].isoformat()
            if 'order_time' in order and hasattr(order.get('order_time'), 'isoformat'):
                 order['order_time'] = order['order_time'].isoformat()

            payment_methods = order.get('payment_methods', [])
            if isinstance(payment_methods, list):
                 for payment in payment_methods:
                     if isinstance(payment, dict) and 'timestamp' in payment and hasattr(payment.get('timestamp'), 'isoformat'):
                         payment['timestamp'] = payment['timestamp'].isoformat()
            else:
                 logging.warning(f"Order {order.get('_id')} has unexpected 'payment_methods' field type: {type(payment_methods)}")
            
            formatted_orders.append(order)

        return formatted_orders

    def update_orders_status(self, order_ids, new_status, courier_id, courier_name):
        logging.info(f"Updating order status: status={new_status}, courier={courier_id} ({courier_name})")
        
        update_fields = {}
        
        # Only set courier info if they're provided
        if courier_id:
            update_fields["courier_id"] = courier_id
            update_fields["courier_name"] = courier_name
            update_fields["sent_to_3rd_party"] = None # Ensure it's always None or remove if not needed

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

    def send_to_tender(self, order_id, tender_scope):
        """
        Update an order to mark it as being in tender process.
        
        Args:
            order_id: The ID of the order to update
            tender_scope: Array of objects containing tender_bid and status fields
            
        Returns:
            The updated order document or None if order was not found
        """
        # First check if the order exists and is in an assignable state
        order = self.db.orders.find_one({"_id": order_id})
        if not order:
            return None
            
        # Update the order with the tender scope and add a new status entry
        update_data = {
            "$set": {
                "tender_scope": tender_scope,
                "selected_vendor": None,  # Initialize as null
                "in_tender": True  # Flag to indicate active tender
            }
        }
        
        result = self.db.orders.update_one({"_id": order_id}, update_data)
        
        if result.modified_count == 0:
            return None
            
        # Fetch the updated order
        updated_order = self.db.orders.find_one({"_id": order_id})
        
        # Convert ObjectId to string for JSON serialization
        updated_order['_id'] = str(updated_order['_id'])
        
        # Format timestamp for JSON
        for status in updated_order.get('status', []):
            if 'timestamp' in status and hasattr(status['timestamp'], 'isoformat'):
                status['timestamp'] = status['timestamp'].isoformat()
                
        return updated_order

    def update_tender_status(self, order_id, vendor_id, new_tender_status):
        """
        Updates the status for a specific vendor within the tender_scope array of an order.
        
        Args:
            order_id: The ID of the order.
            vendor_id: The ID of the vendor whose status is being updated.
            new_tender_status: The new status ("APPROVED" or "DISAPPROVED").
            
        Returns:
            The updated order document or None if not found/updated.
        """
        if new_tender_status not in ["APPROVED", "DISAPPROVED"]:
            logging.warning(f"Invalid tender status update attempted: {new_tender_status}")
            return None # Or raise an error

        result = self.db.orders.update_one(
            {"_id": order_id, "tender_scope.tender_bid": vendor_id},
            {
                "$set": { "tender_scope.$.status": new_tender_status }
            }
        )

        if result.modified_count == 0:
            logging.warning(f"Tender status update failed for order {order_id}, vendor {vendor_id}. Order/Vendor scope not found or status unchanged.")
            # Check if the order exists at all, maybe return it without the change?
            existing_order = self.db.orders.find_one({"_id": order_id})
            if existing_order:
                # Convert and return existing order if needed, even if status wasn't updated
                 existing_order['_id'] = str(existing_order['_id'])
                 for status in existing_order.get('status', []):
                     if 'timestamp' in status and hasattr(status['timestamp'], 'isoformat'):
                         status['timestamp'] = status['timestamp'].isoformat()
                 # Add my_tender_status calculation if returning existing order
                 my_tender_status = "UNKNOWN"
                 if "tender_scope" in existing_order:
                     for scope_item in existing_order["tender_scope"]:
                         if scope_item.get("tender_bid") == vendor_id:
                             my_tender_status = scope_item.get("status", "UNKNOWN")
                             break
                 existing_order['my_tender_status'] = my_tender_status
                 return existing_order
            return None

        # Fetch and return the updated order with formatting
        updated_order = self.db.orders.find_one({"_id": order_id})
        if updated_order:
            updated_order['_id'] = str(updated_order['_id'])
            for status in updated_order.get('status', []):
                if 'timestamp' in status and hasattr(status['timestamp'], 'isoformat'):
                    status['timestamp'] = status['timestamp'].isoformat()
            # Add my_tender_status calculation
            my_tender_status = "UNKNOWN"
            if "tender_scope" in updated_order:
                for scope_item in updated_order["tender_scope"]:
                    if scope_item.get("tender_bid") == vendor_id:
                        my_tender_status = scope_item.get("status", "UNKNOWN")
                        break
            updated_order['my_tender_status'] = my_tender_status
            return updated_order
            
        return None # Should not happen if modified_count was > 0

    def cancel_tender(self, order_id):
        """
        Update an order to mark it as no longer in the tender process.
        
        Args:
            order_id: The ID of the order to update
            
        Returns:
            The updated order document or None if order was not found
        """
        # First check if the order exists
        order = self.db.orders.find_one({"_id": order_id})
        if not order:
            return None
            
        # Update the order: set in_tender to false and clear tender_scope
        update_data = {
            "$set": {
                "in_tender": False
            },
            "$unset": {
                "tender_scope": "",
                "selected_vendor": "" # Also clear selected_vendor if it exists
            }
        }
        
        result = self.db.orders.update_one({"_id": order_id}, update_data)
        
        if result.modified_count == 0:
            # Maybe the order existed but wasn't in tender? Return the order anyway.
            updated_order = self.db.orders.find_one({"_id": order_id})
        else:
            updated_order = self.db.orders.find_one({"_id": order_id})
        
        if not updated_order:
             return None
             
        # Convert ObjectId to string for JSON serialization
        updated_order['_id'] = str(updated_order['_id'])
        
        # Format timestamp for JSON
        for status in updated_order.get('status', []):
            if 'timestamp' in status and hasattr(status['timestamp'], 'isoformat'):
                status['timestamp'] = status['timestamp'].isoformat()
                
        return updated_order

    def get_order(self, order_id):
        """
        Fetch a single order by its ID.
        
        Args:
            order_id: The ID of the order to fetch.
            
        Returns:
            The order document or None if not found.
        """
        order = self.db.orders.find_one({"_id": order_id})
        
        if not order:
            return None
            
        # Format the order for JSON serialization
        order['_id'] = str(order['_id'])
        
        # Format timestamps
        for status in order.get('status', []):
            if 'timestamp' in status and hasattr(status['timestamp'], 'isoformat'):
                status['timestamp'] = status['timestamp'].isoformat()
                
        return order
        
    def update_order(self, order_id, update_data):
        """
        Updates an order with the provided update data.
        
        Args:
            order_id: The ID of the order to update.
            update_data: MongoDB update operation document (e.g., {"$set": {...}})
            
        Returns:
            True if successful, False otherwise.
        """
        try:
            result = self.db.orders.update_one({"_id": order_id}, update_data)
            return result.modified_count > 0
        except Exception as e:
            logging.error(f"Error updating order {order_id}: {str(e)}")
            return False