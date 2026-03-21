from firebase_config import db
import datetime

test_students = [
    {
        "studentID": "111723043001",
        "name": "Riya Sharma",
        "email": "riya@amu.edu",
        "department": "Cloud Computing",
        "year": "3rd Year",
        "biometricID": "BIO001",
        "hasVoted": False,
        "enrolledOn": str(datetime.datetime.now())
    },
    {
        "studentID": "111723044001",
        "name": "Arjun Mehta",
        "email": "arjun@amu.edu",
        "department": "Artificial Intelligence",
        "year": "3rd Year",
        "biometricID": "BIO002",
        "hasVoted": False,
        "enrolledOn": str(datetime.datetime.now())
    },
    {
        "studentID": "111723045001",
        "name": "Priya Singh",
        "email": "priya@amu.edu",
        "department": "Data Science",
        "year": "3rd Year",
        "biometricID": "BIO003",
        "hasVoted": False,
        "enrolledOn": str(datetime.datetime.now())
    },
    {
        "studentID": "111723046001",
        "name": "Rahul Verma",
        "email": "rahul@amu.edu",
        "department": "IoT",
        "year": "3rd Year",
        "biometricID": "BIO004",
        "hasVoted": False,
        "enrolledOn": str(datetime.datetime.now())
    },
    {
        "studentID": "111723047001",
        "name": "Sneha Patel",
        "email": "sneha@amu.edu",
        "department": "Cyber Security",
        "year": "3rd Year",
        "biometricID": "BIO005",
        "hasVoted": False,
        "enrolledOn": str(datetime.datetime.now())
    }
]

for student in test_students:
    db.collection("students").document(student["studentID"]).set(student)
    print(f"✅ Added test student: {student['name']} ({student['studentID']})")