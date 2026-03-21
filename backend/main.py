from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from students import router as students_router
from votes import router as votes_router

app = FastAPI(
    title="CloudBioVote API",
    description="AMU University Biometric Voting System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students_router, prefix="/students", tags=["Students"])
app.include_router(votes_router, prefix="/votes", tags=["Votes"])

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "CloudBioVote API Running! ✅",
        "university": "AMU University",
        "version": "1.0.0"
    }