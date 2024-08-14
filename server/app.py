from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='../client/build')
CORS(app)

@app.route('/api/greeting', methods=['GET'])
def greeting():
    return jsonify({"message": "Hello from the backend!"}), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    print(f"Requested path: {path}")
    print(f"Static folder: {app.static_folder}")
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        print(f"Serving file: {path}")
        return send_from_directory(app.static_folder, path)
    else:
        print("Serving index.html")
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run()