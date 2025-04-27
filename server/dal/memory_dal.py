class MemoryDAL:
    def __init__(self, db):
        self.db = db
        
    def save_memory(self, user_id, content, tags=None):
        """Save a new memory item"""
        memory = {
            "user_id": user_id,
            "content": content,
            "tags": tags or [],
            "created_at": self.db.get_current_timestamp(),
            "isDeleted": False
        }
        return self.db.memories.insert_one(memory).inserted_id
        
    def get_memories(self, user_id, tag=None, limit=50):
        """Get memories for a user, optionally filtered by tag"""
        query = {"user_id": user_id, "isDeleted": {"$ne": True}}
        if tag:
            query["tags"] = tag
        
        return list(self.db.memories.find(query).sort("created_at", -1).limit(limit))
        
    def search_memories(self, user_id, search_term):
        """Search memories by content"""
        query = {
            "user_id": user_id,
            "content": {"$regex": search_term, "$options": "i"},
            "isDeleted": {"$ne": True}
        }
        return list(self.db.memories.find(query).sort("created_at", -1))
        
    def delete_memory(self, memory_id, user_id):
        """Soft delete a memory"""
        result = self.db.memories.update_one(
            {"_id": memory_id, "user_id": user_id},
            {"$set": {"isDeleted": True}}
        )
        return result.modified_count > 0 