from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
import os
from api import businesses, users, orders, auth
from services.database import init_db
import logging

app = Flask(__name__, static_folder='../client/build')
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize database
init_db(app)

# Register blueprints
app.register_blueprint(businesses.bp)
app.register_blueprint(users.bp)
app.register_blueprint(orders.bp)
app.register_blueprint(auth.bp)  # Add this line


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
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)  