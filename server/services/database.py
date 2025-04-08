from pymongo import MongoClient
from config import Config
import certifi
import logging

client = None

def init_db(app):
    global client
    logging.info(f"Attempting to connect to MongoDB with URI: {Config.MONGODB_URI}")
    try:
        client = MongoClient(Config.MONGODB_URI, tlsCAFile=certifi.where(), tlsAllowInvalidCertificates=True)
        # Test the connection
        client.admin.command('ping')
        logging.info("Successfully connected to MongoDB")
        app.db = client[Config.DATABASE_NAME]
    except Exception as e:
        logging.error(f"Failed to connect to MongoDB: {str(e)}")
        raise

def get_db():
    return client[Config.DATABASE_NAME]