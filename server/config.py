import os

class Config:
    MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb+srv://TheDeliveryIsHere:Qwwyw3TC7ys1JZ1r@dev.dm1uesm.mongodb.net/?retryWrites=true&w=majority')
    DATABASE_NAME = 'TheDeliveryIsHere'