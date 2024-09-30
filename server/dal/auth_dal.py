import uuid
from datetime import datetime, timedelta
from pymongo.errors import DuplicateKeyError


class AuthDAL:
    def __init__(self, db):
        self.db = db
        self.MAX_TOKENS_PER_USER = 5  # Limit the number of active tokens per user

    def validate_user(self, username, password):
        user = self.db.users.find_one({"username": username, "password": password})
        return user

    def create_token(self, user_id):
        # Remove expired tokens for this user
        self.remove_expired_tokens(user_id)

        # Count active tokens for this user
        active_tokens_count = self.db.authentication_tokens.count_documents({
            "uid": user_id,
            "expiration_time": {"$gt": datetime.utcnow()}
        })

        # If the user has reached the maximum number of tokens, remove the oldest one
        if active_tokens_count >= self.MAX_TOKENS_PER_USER:
            oldest_token = self.db.authentication_tokens.find_one(
                {"uid": user_id},
                sort=[("expiration_time", 1)]
            )
            if oldest_token:
                self.db.authentication_tokens.delete_one({"_id": oldest_token["_id"]})

        token = str(uuid.uuid4().hex)
        expiration_time = datetime.utcnow() + timedelta(weeks=2)

        try:
            self.db.authentication_tokens.insert_one({
                "_id": token,
                "uid": user_id,
                "expiration_time": expiration_time
            })
            return token, expiration_time
        except DuplicateKeyError:
            # In case of a collision, try again with a new token
            return self.create_token(user_id)

    def validate_token(self, token):
        token_doc = self.db.authentication_tokens.find_one({"_id": token})
        if token_doc and token_doc['expiration_time'] > datetime.utcnow():
            return token_doc['uid']
        return None

    def invalidate_token(self, token):
        self.db.authentication_tokens.delete_one({"_id": token})

    def update_user_password(self, user_id, new_password):
        self.db.users.update_one({"_id": user_id}, {"$set": {"password": new_password}})

    def remove_expired_tokens(self, user_id):
        self.db.authentication_tokens.delete_many({
            "uid": user_id,
            "expiration_time": {"$lte": datetime.utcnow()}
        })

    def cleanup_expired_tokens(self):
        result = self.db.authentication_tokens.delete_many({
            "expiration_time": {"$lte": datetime.utcnow()}
        })
        return result.deleted_count