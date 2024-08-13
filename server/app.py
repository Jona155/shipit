from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # We'll adjust this for Heroku

@app.route('/', methods=['GET'])
def root():
    return jsonify({"message": "Welcome to the Flask backend!"}), 200

@app.route('/api/greeting', methods=['GET'])
def greeting():
    return jsonify({"message": "Hello from the backend!"}), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)