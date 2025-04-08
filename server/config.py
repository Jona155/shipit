import os
import logging

class Config:
    MONGODB_URI = os.environ.get('MONGODB_URI')
    if not MONGODB_URI:
        logging.error("MONGODB_URI environment variable is not set!")
        raise ValueError("MONGODB_URI environment variable is required")
        
    DATABASE_NAME = os.environ.get('DATABASE_NAME', 'TheDeliveryIsHere')