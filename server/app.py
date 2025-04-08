import os
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)

# First check for environment variables (these take precedence)
mongodb_uri = os.environ.get('MONGODB_URI')
database_name = os.environ.get('DATABASE_NAME')

# Load .env only in local development if environment variables aren't set
if not mongodb_uri or not database_name:
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        logging.info("Environment variables not fully set, loading from .env file")
        load_dotenv(dotenv_path=env_path)
    else:
        logging.info("No .env file found and environment variables not fully set")

# Debug: Print environment variables
mongodb_uri = os.environ.get('MONGODB_URI')
logging.info(f"MONGODB_URI exists: {mongodb_uri is not None}")
if mongodb_uri:
    # Log only partial URI to avoid security issues
    masked_uri = mongodb_uri[:15] + "..." if mongodb_uri else "Not set"
    logging.info(f"MONGODB_URI (masked): {masked_uri}")
logging.info(f"DATABASE_NAME: {os.environ.get('DATABASE_NAME')}")

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from api import businesses, users, orders, auth, connections, delivery_group
from services.database import init_db

app = Flask(__name__, static_folder='../client/build')
CORS(app)

# Initialize database
try:
    init_db(app)
    logging.info("Database initialized successfully")
except Exception as e:
    logging.error(f"Failed to initialize database: {str(e)}")
    # We'll let the app continue and fail on actual requests
    # rather than preventing startup completely

# Register blueprints
app.register_blueprint(businesses.bp)
app.register_blueprint(users.bp)
app.register_blueprint(orders.bp)
app.register_blueprint(auth.bp)
app.register_blueprint(connections.bp)
app.register_blueprint(delivery_group.bp)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f"Internal server error: {error}")
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(host='0.0.0.0', port=port)  