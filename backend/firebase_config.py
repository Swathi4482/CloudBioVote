import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
from dotenv import load_dotenv

load_dotenv()

def initialize_firebase():
    if not firebase_admin._apps:
        # Check if running on Render (environment variable)
        firebase_creds_json = os.getenv('FIREBASE_CREDENTIALS_JSON')
        
        if firebase_creds_json:
            # Running on Render - use environment variable
            cred_dict = json.loads(firebase_creds_json)
            cred = credentials.Certificate(cred_dict)
        else:
            # Running locally - use file
            cred = credentials.Certificate('serviceAccountKey.json')
            
        firebase_admin.initialize_app(cred)
    return firestore.client()

db = initialize_firebase()
