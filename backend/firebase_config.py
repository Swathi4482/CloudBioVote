import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()

def initialize_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate(
            os.getenv('FIREBASE_CREDENTIALS')
        )
        firebase_admin.initialize_app(cred)
    return firestore.client()

db = initialize_firebase()