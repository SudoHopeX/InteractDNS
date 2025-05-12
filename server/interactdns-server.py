import json
import uuid
import base64
import random
import string
import requests
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
import time
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

class InteractshClient:
    def __init__(self, host="oast.pro", port=443, scheme=True, authorization=None):
        self.private_key = None
        self.public_key = None
        self.secret_key = None
        self.correlation_id = None
        
        # Configuration
        self.host = host
        self.port = port
        self.scheme = scheme  # True for HTTPS, False for HTTP (HTTPS enforced in registration)
        self.authorization = authorization
        
    def generate_keys(self):
        # Generate RSA key pair
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        self.private_key = private_key
        self.public_key = private_key.public_key()
        
    def get_public_key_pem(self):
        # Get PEM format of public key
        public_key_pem = self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')
        return public_key_pem
    
    def register_client(self):
        # Generate keys if not already generated
        if not self.public_key:
            self.generate_keys()
            
        # Generate UUID-based correlation ID for better uniqueness (32 hex characters)
        self.correlation_id = uuid.uuid4().hex  # Updated to use UUID hex for standard practice
        
        self.secret_key = str(uuid.uuid4())  # Ensure secret key is also UUID-based for consistency
        
        register_data = {
            "public-key": self.get_public_key_pem(),
            "secret-key": self.secret_key,
            "correlation-id": self.correlation_id
        }
        
        # Enforce HTTPS for security, ignoring scheme parameter to always use HTTPS
        url = f"https://{self.host}/register"  # HTTPS is mandatory based on Interactsh best practices
        
        headers = {
            "User-Agent": "Interact.sh Client",
            "Content-Type": "application/json"
        }
        
        if self.authorization:
            headers["Authorization"] = self.authorization
            
        try:
            response = requests.post(url, json=register_data, headers=headers)
            if response.status_code == 200:
                # Return domain and token information
                domain = self.get_interact_domain()  # Generate domain based on new correlation ID
                return {
                    "success": True,
                    "domain": domain,
                    "id": self.secret_key,  # Matches JS expectations
                    "correlation_id": self.correlation_id
                }
            else:
                return {
                    "success": False,
                    "error": f"Server returned status code {response.status_code}: {response.text}"
                }
        except requests.RequestException as e:
            return {
                "success": False,
                "error": f"Request error: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }
    
    def poll(self):
        # No changes made to poll method as the query focused on registration
        protocol = "https" if self.scheme else "http"
        url = f"{protocol}://{self.host}/poll"
        
        params = {
            "id": self.correlation_id,
            "secret": self.secret_key
        }
        
        headers = {
            "User-Agent": "Interact.sh Client"
        }
        
        if self.authorization:
            headers["Authorization"] = self.authorization
            
        try:
            response = requests.get(url, params=params, headers=headers)
            
            if response.status_code != 200:
                return {
                    "success": False,
                    "error": f"Poll was unsuccessful: status code {response.status_code}"
                }
                
            data = response.json()
            aes_key = data.get("aes_key")
            key = self.decrypt_aes_key(aes_key)
            
            interactions = []
            if "data" in data and data["data"]:
                for d in data["data"]:
                    decrypted_data = self.decrypt_data(d, key)
                    interaction = json.loads(decrypted_data)
                    interactions.append(interaction)
            
            return {
                "success": True,
                "data": interactions
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def deregister(self):
        # No changes made to deregister method
        deregister_data = {
            "correlation-id": self.correlation_id,
            "secret-key": self.secret_key
        }
        
        protocol = "https" if self.scheme else "http"
        url = f"{protocol}://{self.host}/deregister"
        
        headers = {
            "User-Agent": "Interact.sh Client",
            "Content-Type": "application/json"
        }
        
        if self.authorization:
            headers["Authorization"] = self.authorization
            
        try:
            response = requests.post(url, json=deregister_data, headers=headers)
            return {
                "success": response.status_code == 200
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_interact_domain(self):
        if not self.correlation_id:
            return ""
        
        # Interactsh typically expects a correlation ID-based domain; no padding needed if ID is standard length
        # Use host directly; correlation ID should be sufficient for uniqueness
        return f"{self.correlation_id}.{self.host}"  # Simplified based on Interactsh protocol
    
    def decrypt_aes_key(self, encrypted):
        # No changes made to decryption methods
        cipher_text = base64.b64decode(encrypted)
        plaintext = self.private_key.decrypt(
            cipher_text,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return plaintext.decode('utf-8')
    
    def decrypt_data(self, input_data, key):
        cipher_text_array = base64.b64decode(input_data)
        iv = cipher_text_array[:16]
        cipher_text = cipher_text_array[16:-1]  # Excluding the last byte
        cipher = Cipher(
            algorithms.AES(key.encode()),
            modes.CFB(iv),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        decrypted = decryptor.update(cipher_text) + decryptor.finalize()
        return decrypted.decode('utf-8')

# Global client storage - consider using a more robust storage solution in production, e.g., session management
clients = {}

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    host = data.get('server', 'oast.fun')
    port = data.get('port', 443)
    scheme = data.get('scheme', True)  # Scheme is still accepted but HTTPS is enforced in client
    authorization = data.get('authorization')
    
    client = InteractshClient(host=host, port=port, scheme=scheme, authorization=authorization)
    result = client.register_client()
    
    if result.get('success', False):
        # Store the client for later use
        client_id = result['id']  # Use secret_key as ID
        clients[client_id] = client
        
    return jsonify(result)

@app.route('/api/poll', methods=['GET'])
def poll():
    token = request.args.get('id')
    if not token or token not in clients:
        return jsonify({
            'success': False,
            'error': 'Invalid or missing token'
        }), 400
    
    client = clients[token]
    result = client.poll()
    
    return jsonify(result)

@app.route('/api/deregister', methods=['POST'])
def deregister():
    data = request.get_json()
    token = data.get('id')
    
    if not token or token not in clients:
        return jsonify({
            'success': False,
            'error': 'Invalid or missing token'
        }), 400
    
    client = clients[token]
    result = client.deregister()
    
    # Remove client from storage if deregistration was successful
    if result.get('success', False):
        del clients[token]
    
    return jsonify(result)

@app.route('/api/domain', methods=['GET'])
def get_domain():
    token = request.args.get('id')
    
    if not token or token not in clients:
        return jsonify({
            'success': False,
            'error': 'Invalid or missing token'
        }), 400
    
    client = clients[token]
    
    return jsonify({
        'success': True,
        'domain': client.get_interact_domain()
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
