import os

class Config:
    MONGODB_URI = os.environ.get('MONGODB_URI')
    DATABASE_NAME = 'TheDeliveryIsHere'