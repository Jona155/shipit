from pymongo import MongoClient
from server.config import Config
import certifi

client = None

def init_db(app):
    global client
    client = MongoClient(Config.MONGODB_URI, tlsCAFile=certifi.where(), tlsAllowInvalidCertificates=True)
    app.db = client[Config.DATABASE_NAME]

def get_db():
    return client[Config.DATABASE_NAME]