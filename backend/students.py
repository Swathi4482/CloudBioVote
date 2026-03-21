from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_config import db

router = APIRouter()

VALID_DEPARTMENTS = {
    "Cloud Computing":         (111723043001, 111723043050),
    "Artificial Intelligence": (111723044001, 111723044050),
    "Data Science":            (111723045001, 111723045050),
    "IoT":                     (111723046001, 111723046050),
    "Cyber Security":          (111723047001, 111723047050),
}

VALID_FACULTY = ["wanda", "elena", "sage", "stefan", "iso", "srk"]

CANDIDATES = {
    "1": "Isabel Conklin",
    "2": "Conrad Fisher",
    "3": "Jeremiah Fisher",
    "4": "Steven Conklin",
    "5": "Tylor"
}

class Student(BaseModel):
    studentID: str
    name: str
    email: str
    department: str
    year: str
    biometricID: str

class VerifyBiometric(BaseModel):
    studentID: str
    biometricID: str

def validate_uid(studentID: str):
    try:
        uid = int(studentID)
    except:
        return None
    for dept, (min_uid, max_uid) in VALID_DEPARTMENTS.items():
        if min_uid <= uid <= max_uid:
            return dept
    return None

@router.post("/enroll")
def enroll_student(student: Student):
    try:
        dept = validate_uid(student.studentID)
        if not dept:
            raise HTTPException(status_code=400, detail="Invalid Student ID")
        existing = db.collection("students").document(student.studentID).get()
        if existing.exists:
            raise HTTPException(status_code=400, detail="Student already enrolled")
        db.collection("students").document(student.studentID).set({
            "name": student.name,
            "email": student.email,
            "department": dept,
            "year": student.year,
            "biometricID": student.biometricID,
            "hasVoted": False,
            "enrolledOn": str(__import__('datetime').datetime.now())
        })
        return {"message": f"Student {student.name} enrolled successfully ✅", "department": dept}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify")
def verify_student(data: VerifyBiometric):
    try:
        dept = validate_uid(data.studentID)
        if not dept:
            raise HTTPException(status_code=400, detail="Invalid Student ID")
        doc = db.collection("students").document(data.studentID).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Student not registered")
        student = doc.to_dict()
        if student["hasVoted"]:
            raise HTTPException(status_code=403, detail="You have already voted!")
        return {
            "verified": True,
            "studentID": data.studentID,
            "name": student["name"],
            "department": student["department"],
            "year": student["year"],
            "hasVoted": student["hasVoted"]
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all")
def get_all_students():
    try:
        docs = db.collection("students").stream()
        students = []
        for doc in docs:
            data = doc.to_dict()
            students.append({
                "studentID": doc.id,
                "name": data["name"],
                "department": data["department"],
                "hasVoted": data["hasVoted"]
            })
        return {"students": students, "total": len(students)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/candidates")
def get_candidates():
    return {"candidates": CANDIDATES}

@router.get("/departments")
def get_departments():
    return {"departments": list(VALID_DEPARTMENTS.keys())}
    return {
    "verified": True,
    "studentID": data.studentID,
    "name": student["name"],
    "email": student.get("email", ""),
    "department": student["department"],
    "year": student["year"],
    "hasVoted": student["hasVoted"]
}
