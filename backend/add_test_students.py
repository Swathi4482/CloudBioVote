from firebase_config import db
import datetime

departments = [
    {"prefix": "111723043", "name": "Cloud Computing"},
    {"prefix": "111723044", "name": "Artificial Intelligence"},
    {"prefix": "111723045", "name": "Data Science"},
    {"prefix": "111723046", "name": "IoT"},
    {"prefix": "111723047", "name": "Cyber Security"},
]

# Generic names for bulk population
first_names = [
    "Aarav","Aisha","Arjun","Ananya","Amit","Bhavya","Chirag","Deepa","Dev","Divya",
    "Farhan","Fatima","Gaurav","Geeta","Harsh","Isha","Ishaan","Jaya","Kabir","Kavya",
    "Kunal","Lakshmi","Manish","Meena","Mohit","Nadia","Nikhil","Nisha","Om","Pooja",
    "Priya","Rahul","Ravi","Riya","Rohit","Sachin","Sakshi","Sana","Shiv","Shreya",
    "Simran","Sneha","Sonal","Suresh","Tanvi","Tarun","Uday","Uma","Varun","Vikram"
]

last_names = [
    "Sharma","Mehta","Singh","Verma","Patel","Kumar","Gupta","Joshi","Rao","Khan",
    "Mishra","Iyer","Nair","Reddy","Bhat","Chopra","Malhotra","Trivedi","Pandey","Shah",
    "Sinha","Das","Roy","Ghosh","Mukherjee","Pillai","Menon","Naidu","Rajan","Bose",
    "Chauhan","Tiwari","Dubey","Saxena","Agarwal","Bansal","Goel","Mittal","Arora","Walia",
    "Bajaj","Kapoor","Kohli","Oberoi","Sethi","Taneja","Bedi","Dhawan","Grewal","Sandhu"
]

now = str(datetime.datetime.now())
added = 0
skipped = 0

for dept in departments:
    for i in range(1, 51):  # 001 to 050
        uid = f"{dept['prefix']}{i:03d}"
        name = f"{first_names[i-1]} {last_names[i-1]}"
        email = f"{first_names[i-1].lower()}.{uid[-3:]}@amu.edu"
        bio_id = f"BIO{dept['prefix'][-3:]}{i:03d}"

        student = {
            "studentID": uid,
            "name": name,
            "email": email,
            "department": dept["name"],
            "year": "3rd Year",
            "biometricID": bio_id,
            "hasVoted": False,
            "enrolledOn": now
        }

        db.collection("students").document(uid).set(student)
        print(f"✅ Added: {name} | {uid} | {dept['name']}")
        added += 1

print(f"\n🎉 Done! {added} students added to Firebase.")
print("You can now test login with any UID from 111723043001 to 111723047050.")