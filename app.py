import os
import json
import uuid
from fastapi import FastAPI, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

from agents.orchestrator import OrchestratorAgent
from agents.search_agent import ServiceSearchAgent

app = FastAPI(
    title="MySupportBuddy - Peer Support & Crisis Resource API",
    description="Routes users to accredited peer support buddies or the general warmline, with privacy-protected buddy notifications.",
    version="2.1.0"
)

# User Database Persistence
USERS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.json")

def load_users():
    if not os.path.exists(USERS_FILE):
        return {"users": []}
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(data):
    with open(USERS_FILE, "w") as f:
        json.dump(data, f, indent=2)

class UserAuthRequest(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    tier: str = "Standard"

search_agent = ServiceSearchAgent()
default_orchestrator = OrchestratorAgent(search_agent=search_agent)


class MessageRequest(BaseModel):
    message: str
    custom_api_key: str = None


class CrisisCallRequest(BaseModel):
    buddy_id: str
    duration_minutes: int
    timestamp: str


@app.post("/api/auth/signup")
async def signup(payload: UserAuthRequest):
    data = load_users()
    if any(u["email"] == payload.email for u in data["users"]):
        raise HTTPException(status_code=400, detail="Email already in use")
    
    new_user = {
        "id": str(uuid.uuid4()),
        "email": payload.email,
        "password": payload.password,
        "tier": "Standard"
    }
    data["users"].append(new_user)
    save_users(data)
    return {"id": new_user["id"], "email": new_user["email"], "tier": new_user["tier"]}


@app.post("/api/auth/login")
async def login(payload: UserAuthRequest):
    data = load_users()
    user = next((u for u in data["users"] if u["email"] == payload.email and u["password"] == payload.password), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"id": user["id"], "email": user["email"], "tier": user["tier"]}


@app.get("/api/auth/profile/{user_id}")
async def get_profile(user_id: str):
    data = load_users()
    user = next((u for u in data["users"] if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user["id"], "email": user["email"], "tier": user["tier"]}


@app.post("/api/support")
async def request_support(payload: MessageRequest):
    """Main triage endpoint. Analyzes user message and routes to buddy or warmline."""
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        if payload.custom_api_key and payload.custom_api_key.strip():
            original_key = os.environ.get("GEMINI_API_KEY")
            try:
                os.environ["GEMINI_API_KEY"] = payload.custom_api_key.strip()
                orchestrator = OrchestratorAgent(search_agent=search_agent)
                result = orchestrator.process_request(payload.message)
            finally:
                if original_key:
                    os.environ["GEMINI_API_KEY"] = original_key
                else:
                    os.environ.pop("GEMINI_API_KEY", None)
        else:
            result = default_orchestrator.process_request(payload.message)

        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/crisis-call-log")
async def log_crisis_call(payload: CrisisCallRequest):
    """
    Privacy-protected crisis call logger.
    Notifies the buddy with call metadata only (time + duration).
    Call content is never stored or shared.
    """
    try:
        result = default_orchestrator.log_crisis_call(
            buddy_id=payload.buddy_id,
            duration_minutes=payload.duration_minutes,
            timestamp=payload.timestamp
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/buddies")
async def list_buddies():
    """Returns all accredited buddies and their availability status."""
    return {
        "buddies": search_agent.get_all_buddies(),
        "crisis_line": search_agent.get_crisis_line()
    }


# Serve static frontend
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    @app.get("/")
    async def root():
        return {"message": "MySupportBuddy API running. Static frontend not found."}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
