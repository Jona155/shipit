import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# Load environment variables from .env file in parent directory
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
logging.info(f"Loading .env file from: {env_path}")
load_dotenv(dotenv_path=env_path)

# Debug: Print environment variables
logging.info(f"MONGODB_URI: {os.environ.get('MONGODB_URI')}")
logging.info(f"DATABASE_NAME: {os.environ.get('DATABASE_NAME')}")

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from api import businesses, users, orders, auth, connections, delivery_group
from services.database import init_db

app = Flask(__name__, static_folder='../client/build')
CORS(app)

# Initialize database
init_db(app)

# Register blueprints
app.register_blueprint(businesses.bp)
app.register_blueprint(users.bp)
app.register_blueprint(orders.bp)
app.register_blueprint(auth.bp)
app.register_blueprint(connections.bp)
# Add this line
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