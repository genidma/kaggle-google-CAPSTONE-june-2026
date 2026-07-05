import os
os.environ["GOOGLE_CLOUD_PROJECT"] = "kaggle-june-2026-capstone"
import json
import uuid
import hashlib
from fastapi import FastAPI, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from google.cloud import firestore
from google.cloud.firestore import FieldFilter

load_dotenv()

from agents.orchestrator import OrchestratorAgent
from agents.search_agent import ServiceSearchAgent

app = FastAPI(
    title="MySupportBuddy - Peer Support & Crisis Resource API",
    description="Routes users to accredited peer support buddies or the general warmline, with privacy-protected buddy notifications.",
    version="2.2.0"
)

# Initialize GCP Firestore Client
db = firestore.Client(project="kaggle-june-2026-capstone")

@app.on_event("startup")
async def startup_event():
    """Auto-seeds the default buddies and settings into Firestore if the database is empty."""
    try:
        buddies_ref = db.collection("buddies")
        docs = list(buddies_ref.limit(1).stream())
        base_dir = os.path.dirname(os.path.abspath(__file__))
        resources_path = os.path.join(base_dir, "data", "resources.json")
        
        if not docs:
            print("Seeding buddies to Firestore database...")
            if os.path.exists(resources_path):
                with open(resources_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                buddies = data.get("accredited_buddies", [])
                for buddy in buddies:
                    buddies_ref.document(buddy["id"]).set(buddy)
                print(f"Successfully seeded {len(buddies)} buddies.")

        crisis_ref = db.collection("settings").document("crisis_line")
        if not crisis_ref.get().exists:
            print("Seeding crisis line to settings collection...")
            if os.path.exists(resources_path):
                with open(resources_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                crisis_data = data.get("general_crisis_line", {})
                if crisis_data:
                    crisis_ref.set(crisis_data)
                print("Successfully seeded crisis line settings.")
    except Exception as e:
        print(f"Error seeding buddies database: {e}")

def hash_password(password: str, salt: bytes = None) -> str:
    if salt is None:
        salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt.hex() + ":" + key.hex()

def verify_password(stored_password: str, provided_password: str) -> bool:
    try:
        salt_hex, key_hex = stored_password.split(":")
        salt = bytes.fromhex(salt_hex)
        key = bytes.fromhex(key_hex)
        new_key = hashlib.pbkdf2_hmac('sha256', provided_password.encode('utf-8'), salt, 100000)
        return new_key == key
    except Exception:
        return False

class UserAuthRequest(BaseModel):
    email: str
    password: str

class UserChangePasswordRequest(BaseModel):
    email: str
    current_password: str
    new_password: str
    confirm_new_password: str

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
    email_normalized = payload.email.lower().strip()
    user_ref = db.collection("users").document(email_normalized)
    try:
        user_doc = user_ref.get()
        if user_doc.exists:
            raise HTTPException(status_code=400, detail="Email already in use")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    new_user = {
        "id": str(uuid.uuid4()),
        "email": email_normalized,
        "password": hash_password(payload.password),
        "tier": "Standard"
    }
    try:
        user_ref.set(new_user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")
    return {"id": new_user["id"], "email": new_user["email"], "tier": new_user["tier"]}


@app.post("/api/auth/login")
async def login(payload: UserAuthRequest):
    email_normalized = payload.email.lower().strip()
    user_ref = db.collection("users").document(email_normalized)
    try:
        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        user_data = user_doc.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    if not verify_password(user_data["password"], payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"id": user_data["id"], "email": user_data["email"], "tier": user_data["tier"]}


@app.get("/api/auth/profile/{user_id}")
async def get_profile(user_id: str):
    try:
        users_ref = db.collection("users")
        query = users_ref.where(filter=FieldFilter("id", "==", user_id)).limit(1)
        docs = list(query.stream())
        if not docs:
            raise HTTPException(status_code=404, detail="User not found")
        user_data = docs[0].to_dict()
        return {"id": user_data["id"], "email": user_data["email"], "tier": user_data["tier"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/api/auth/change-password")
async def change_password(payload: UserChangePasswordRequest):
    email_normalized = payload.email.lower().strip()
    user_ref = db.collection("users").document(email_normalized)
    try:
        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        user_data = user_doc.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    if not verify_password(user_data["password"], payload.current_password):
        raise HTTPException(status_code=401, detail="Invalid current password")

    if payload.new_password != payload.confirm_new_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")

    new_hash = hash_password(payload.new_password)
    try:
        user_ref.update({"password": new_hash})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {"status": "success", "message": "Password changed successfully"}


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
