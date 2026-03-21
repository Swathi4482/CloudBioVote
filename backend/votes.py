from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_config import db
import datetime

router = APIRouter()

CANDIDATES = {
    "1": "Isabel Conklin",
    "2": "Conrad Fisher",
    "3": "Jeremiah Fisher",
    "4": "Steven Conklin",
    "5": "Tylor"
}

VALID_FACULTY = ["wanda", "elena", "sage", "stefan", "iso", "srk"]

class Vote(BaseModel):
    studentID: str
    candidateID: str

class FacultyLogin(BaseModel):
    name: str

@router.post("/cast")
def cast_vote(vote: Vote):
    try:
        if vote.candidateID not in CANDIDATES:
            raise HTTPException(status_code=400, detail="Invalid candidate")
        doc = db.collection("students").document(vote.studentID).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Student not found")
        student = doc.to_dict()
        if student["hasVoted"]:
            raise HTTPException(status_code=403, detail="You have already voted! 🚫")
        db.collection("votes").add({
            "studentID": vote.studentID,
            "candidateID": vote.candidateID,
            "candidateName": CANDIDATES[vote.candidateID],
            "department": student["department"],
            "timestamp": str(datetime.datetime.now()),
            "status": "verified"
        })
        db.collection("students").document(vote.studentID).update({
            "hasVoted": True
        })
        receipt = f"AMU{datetime.datetime.now().strftime('%f')[:6]}"
        return {
            "message": "Vote cast successfully ✅",
            "votedFor": CANDIDATES[vote.candidateID],
            "receipt": receipt
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results")
def get_results():
    try:
        votes = db.collection("votes").stream()
        counts = {cid: 0 for cid in CANDIDATES}
        for vote in votes:
            data = vote.to_dict()
            cid = data.get("candidateID")
            if cid in counts:
                counts[cid] += 1
        total = sum(counts.values())
        max_votes = max(counts.values()) if total > 0 else 0
        winners = [
            CANDIDATES[cid]
            for cid, v in counts.items()
            if v == max_votes and max_votes > 0
        ]
        results = [
            {
                "candidateID": cid,
                "name": CANDIDATES[cid],
                "votes": counts[cid]
            }
            for cid in CANDIDATES
        ]
        if total == 0:
            outcome = "No votes yet"
            winner = None
        elif len(winners) > 1:
            outcome = "TIE - Nobody won! Try again"
            winner = None
        else:
            outcome = f"{winners[0]} won!"
            winner = winners[0]
        voted = sum(
            1 for s in db.collection("students")
            .where("hasVoted", "==", True).stream()
        )
        return {
            "results": results,
            "totalVotes": total,
            "totalVoted": voted,
            "winner": winner,
            "outcome": outcome
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/faculty/login")
def faculty_login(data: FacultyLogin):
    try:
        if data.name.lower() not in VALID_FACULTY:
            raise HTTPException(status_code=401, detail="Unauthorized faculty member")
        return {
            "message": f"Welcome Prof. {data.name.capitalize()} ✅",
            "authorized": True
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))