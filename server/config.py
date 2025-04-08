import os
import logging

class Config:
    # Use a getter method to avoid errors at import time
    @property
    def MONGODB_URI(self):
        uri = os.environ.get('MONGODB_URI')
        if not uri:
            logging.error("MONGODB_URI environment variable is not set!")
        return uri
        
    @property
    def DATABASE_NAME(self):
        return os.environ.get('DATABASE_NAME', 'TheDeliveryIsHere')

# Create a singleton instance
Config = Config()