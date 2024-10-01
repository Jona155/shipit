class BusinessesDAL:
    def __init__(self, db):
        self.db = db

    def get_businesses_for_user(self, user_id):
        user_businesses = self.db.user_businesses.find({
            "uid": user_id,
            "isDeleted": {"$ne": True}
        })

        is_application_manager = False
        business_ids = set()

        for ub in user_businesses:
            profiles = ub.get('profiles', {})
            if 'ApplicationManager' in profiles:
                is_application_manager = True
                break
            if 'businessManager' in profiles:
                business_ids.add(ub['bid'])

        if is_application_manager:
            # If user is an ApplicationManager, return all businesses
            businesses = self.db.businesses.find()
        else:
            # Otherwise, return only the businesses they manage
            businesses = self.db.businesses.find({"_id": {"$in": list(business_ids)}})

        return list(businesses)

    def get_business(self, business_id):
        return self.db.businesses.find_one({"_id": business_id})

    def user_has_access_to_business(self, user_id, business_id):
        user_business = self.db.user_businesses.find_one({
            "uid": user_id,
            "bid": business_id,
            "isDeleted": {"$ne": True}
        })

        if user_business:
            profiles = user_business.get('profiles', {})
            return 'ApplicationManager' in profiles or 'businessManager' in profiles

        # Check if the user is an ApplicationManager for any business
        application_manager = self.db.user_businesses.find_one({
            "uid": user_id,
            "isDeleted": {"$ne": True},
            "profiles.ApplicationManager": {"$exists": True}
        })

        return application_manager is not None