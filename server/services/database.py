from pymongo import MongoClient
from config import Config
import certifi
import logging
import os

client = None

def init_db(app):
    global client
    
    # Get MongoDB URI from environment
    mongodb_uri = os.environ.get('MONGODB_URI') or Config.MONGODB_URI
    if not mongodb_uri:
        error_msg = "MONGODB_URI environment variable is not set!"
        logging.error(error_msg)
        raise ValueError(error_msg)
    
    logging.info("Attempting to connect to MongoDB...")
    try:
        client = MongoClient(mongodb_uri, tlsCAFile=certifi.where(), 
                            tlsAllowInvalidCertificates=True,
                            serverSelectionTimeoutMS=5000)  # 5 second timeout
        
        # Test the connection
        client.admin.command('ping')
        logging.info("Successfully connected to MongoDB")
        
        # Get database name
        db_name = os.environ.get('DATABASE_NAME') or Config.DATABASE_NAME
        logging.info(f"Using database: {db_name}")
        
        app.db = client[db_name]
    except Exception as e:
        logging.error(f"Failed to connect to MongoDB: {str(e)}")
        raise

def get_db():
    if client is None:
        logging.error("Database client is not initialized")
        raise Exception("Database connection not initialized. Call init_db first.")
    
    db_name = os.environ.get('DATABASE_NAME') or Config.DATABASE_NAME
    return client[db_name]