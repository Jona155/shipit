# connections_dal.py
# Data Access Layer for the connections collection.
# This module provides methods to fetch, create, update, and retrieve connection documents.
from bson.objectid import ObjectId

class ConnectionsDAL:
    def __init__(self, db):
        # Use the "connections" collection from the database.
        self.collection = db['connections']

    def get_connections_for_business(self, business_id):
        """
        Retrieve all connection documents for a given restaurant (business_id).
        """
        connections = list(self.collection.find({"business_id": business_id}))
        # Optionally convert _id to a string for JSON serialization.
        for conn in connections:
            conn["_id"] = str(conn["_id"])
        return connections

    def create_connection(self, connection_data):
        """
        Create a new connection document.
        """
        result = self.collection.insert_one(connection_data)
        connection_data["_id"] = str(result.inserted_id)
        return connection_data

    def update_connection(self, connection_id, update_data):
        """
        Update an existing connection document.
        """
        self.collection.update_one({"_id": ObjectId(connection_id)}, {"$set": update_data})
        return self.get_connection_by_id(connection_id)

    def get_connection_by_id(self, connection_id):
        """
        Retrieve a connection document by its _id.
        """
        connection = self.collection.find_one({"_id": ObjectId(connection_id)})
        if connection:
            connection["_id"] = str(connection["_id"])
        return connection
