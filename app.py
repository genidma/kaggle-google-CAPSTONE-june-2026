import os
os.environ["GOOGLE_CLOUD_PROJECT"] = "kaggle-june-2026-capstone"
import json
import uuid
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Body, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from google.cloud import firestore
from google.cloud.firestore import FieldFilter
import jwt

load_dotenv()

from agents.orchestrator import OrchestratorAgent
from agents.search_agent import ServiceSearchAgent

# ---------------------------------------------------------------------------
# JWT Configuration
# ---------------------------------------------------------------------------
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 72  # 3-day sessions

def create_jwt(user_id: str, email: str, tier: str) -> str:
    """Issue a signed JWT containing the user's identity claims."""
    payload = {
        "sub": user_id,
        "email": email,
        "tier": tier,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt(token: str) -> dict:
    """Decode and verify a JWT. Raises on expiry or tampering."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

async def get_current_user(request: Request) -> dict:
    """FastAPI dependency that extracts and validates the JWT from the
    Authorization header. Returns the decoded claims dict."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = auth_header[7:]
    try:
        claims = decode_jwt(token)
        return claims
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired — please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user_optional(request: Request) -> Optional[dict]:
    """FastAPI dependency that extracts JWT if present, returning None if absent/invalid."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:]
    try:
        return decode_jwt(token)
    except Exception:
        return None

# ---------------------------------------------------------------------------
# Firestore & Application Setup
# ---------------------------------------------------------------------------
db = firestore.Client(project="kaggle-june-2026-capstone")

async def seed_database():
    """Auto-seeds the default buddies and settings into Firestore if the database is empty."""
    try:
        buddies_ref = db.collection("buddies")
        docs = list(buddies_ref.limit(1).stream())
        base_dir = os.path.dirname(os.path.abspath(__file__))
        resources_path = os.path.join(base_dir, "data", "resources.json")

        print("Syncing buddies to Firestore database...")
        if os.path.exists(resources_path):
            with open(resources_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            buddies = data.get("accredited_buddies", [])
            for buddy in buddies:
                buddies_ref.document(buddy["id"]).set(buddy, merge=True)
            print(f"Successfully synced {len(buddies)} buddies.")

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

@asynccontextmanager
async def lifespan(app):
    """Modern lifespan handler — replaces deprecated @app.on_event('startup')."""
    await seed_database()
    yield

app = FastAPI(
    title="MySupportBuddy - Peer Support & Crisis Resource API",
    description="Routes users to accredited peer support buddies or the general warmline, with privacy-protected buddy notifications.",
    version="3.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mysupportbuddy-170198436835.us-central1.run.app",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Password Helpers
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------
class UserAuthRequest(BaseModel):
    email: str
    password: str

class UserChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_new_password: str

class MessageRequest(BaseModel):
    message: str

class CrisisCallRequest(BaseModel):
    buddy_id: str
    duration_minutes: int
    timestamp: str

# ---------------------------------------------------------------------------
# Agents
# ---------------------------------------------------------------------------
search_agent = ServiceSearchAgent()
default_orchestrator = OrchestratorAgent(search_agent=search_agent)

# ---------------------------------------------------------------------------
# Auth Endpoints
# ---------------------------------------------------------------------------
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

    user_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "email": email_normalized,
        "password": hash_password(payload.password),
        "tier": "Standard"
    }
    try:
        user_ref.set(new_user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

    token = create_jwt(user_id, email_normalized, "Standard")
    return {"id": user_id, "email": email_normalized, "tier": "Standard", "token": token}


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

    token = create_jwt(user_data["id"], user_data["email"], user_data["tier"])
    return {"id": user_data["id"], "email": user_data["email"], "tier": user_data["tier"], "token": token}


@app.get("/api/auth/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """Returns the authenticated user's profile from their JWT claims."""
    return {"id": user["sub"], "email": user["email"], "tier": user["tier"]}


@app.post("/api/auth/change-password")
async def change_password(payload: UserChangePasswordRequest, user: dict = Depends(get_current_user)):
    email_normalized = user["email"]
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


# ---------------------------------------------------------------------------
# Support Endpoint
# ---------------------------------------------------------------------------
@app.post("/api/support")
async def request_support(payload: MessageRequest):
    """Main triage endpoint. Analyzes user message and routes to buddy or warmline."""
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        result = default_orchestrator.process_request(payload.message)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Crisis Call Logging
# ---------------------------------------------------------------------------
@app.post("/api/crisis-call-log")
async def log_crisis_call(payload: CrisisCallRequest, user: Optional[dict] = Depends(get_current_user_optional)):
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
        if result.get("status") == "success" and db:
            log_id = str(uuid.uuid4())
            log_doc = {
                "id": log_id,
                "buddy_id": payload.buddy_id,
                "buddy_name": result["notification"].get("buddy_name", "Support Buddy"),
                "duration_minutes": payload.duration_minutes,
                "timestamp": payload.timestamp,
                "user_email": user["email"] if user else "anonymous",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "event": "warmline_call",
                "privacy_note": "Call content is confidential and has not been recorded or shared.",
                "suggested_buddy_action": result["notification"].get("suggested_buddy_action", "")
            }
            try:
                db.collection("crisis_calls").document(log_id).set(log_doc)
                if user:
                    db.collection("users").document(user["email"]).collection("crisis_calls").document(log_id).set(log_doc)
            except Exception as db_err:
                print(f"Warning: could not persist crisis call log: {db_err}")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/crisis-calls")
async def get_crisis_calls(user: dict = Depends(get_current_user)):
    """Retrieve warmline call logs for the logged-in user or buddy."""
    if not db:
        return {"calls": []}
    try:
        calls = []
        user_calls_ref = db.collection("users").document(user["email"]).collection("crisis_calls").order_by("created_at", direction=firestore.Query.DESCENDING).limit(50)
        for doc in user_calls_ref.stream():
            calls.append(doc.to_dict())
        return {"calls": calls}
    except Exception as e:
        print(f"Error fetching crisis calls: {e}")
        return {"calls": []}


# ---------------------------------------------------------------------------
# Buddies
# ---------------------------------------------------------------------------
@app.get("/api/buddies")
async def list_buddies():
    """Returns all accredited buddies and their availability status."""
    return {
        "buddies": search_agent.get_all_buddies(),
        "crisis_line": search_agent.get_crisis_line()
    }


# ---------------------------------------------------------------------------
# Conversations (Phase 2) — JWT-protected chat persistence
# ---------------------------------------------------------------------------
TRASH_RETENTION_DAYS = 30

class ConversationCreateRequest(BaseModel):
    title: str = "New Conversation"

class ConversationMessageRequest(BaseModel):
    message: str


@app.get("/api/conversations")
async def list_conversations(user: dict = Depends(get_current_user)):
    """List all active (non-trashed) conversations for the authenticated user."""
    try:
        convos_ref = db.collection("users").document(user["email"]).collection("conversations")
        docs = convos_ref.order_by("updated_at", direction=firestore.Query.DESCENDING).stream()
        result = []
        for doc in docs:
            data = doc.to_dict()
            if data.get("trashed_at"):
                continue  # skip trashed
            result.append({
                "id": doc.id,
                "title": data.get("title", "Untitled"),
                "created_at": data.get("created_at", ""),
                "updated_at": data.get("updated_at", ""),
                "message_count": data.get("message_count", 0),
            })
        return {"conversations": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/api/conversations")
async def create_conversation(payload: ConversationCreateRequest, user: dict = Depends(get_current_user)):
    """Create a new conversation."""
    try:
        now = datetime.now(timezone.utc).isoformat()
        conv_id = str(uuid.uuid4())
        convos_ref = db.collection("users").document(user["email"]).collection("conversations")
        convos_ref.document(conv_id).set({
            "title": payload.title,
            "created_at": now,
            "updated_at": now,
            "message_count": 0,
            "trashed_at": None,
        })
        return {"id": conv_id, "title": payload.title, "created_at": now}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/conversations/{conv_id}")
async def get_conversation(conv_id: str, user: dict = Depends(get_current_user)):
    """Get all messages in a conversation."""
    try:
        conv_ref = db.collection("users").document(user["email"]).collection("conversations").document(conv_id)
        conv_doc = conv_ref.get()
        if not conv_doc.exists:
            raise HTTPException(status_code=404, detail="Conversation not found")

        conv_data = conv_doc.to_dict()
        msgs_ref = conv_ref.collection("messages").order_by("timestamp").stream()
        messages = []
        for msg_doc in msgs_ref:
            msg = msg_doc.to_dict()
            msg["id"] = msg_doc.id
            messages.append(msg)

        return {
            "id": conv_id,
            "title": conv_data.get("title", "Untitled"),
            "created_at": conv_data.get("created_at", ""),
            "messages": messages,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/api/conversations/{conv_id}/messages")
async def add_message(conv_id: str, payload: ConversationMessageRequest, user: dict = Depends(get_current_user)):
    """Add a user message to a conversation, trigger AI response, and store both."""
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        now = datetime.now(timezone.utc).isoformat()
        conv_ref = db.collection("users").document(user["email"]).collection("conversations").document(conv_id)
        conv_doc = conv_ref.get()
        if not conv_doc.exists:
            raise HTTPException(status_code=404, detail="Conversation not found")

        msgs_ref = conv_ref.collection("messages")

        # Store user message
        user_msg_id = str(uuid.uuid4())
        msgs_ref.document(user_msg_id).set({
            "role": "user",
            "content": payload.message,
            "timestamp": now,
        })

        # Get AI response
        ai_result = default_orchestrator.process_request(payload.message)

        # Store AI response
        ai_msg_id = str(uuid.uuid4())
        ai_now = datetime.now(timezone.utc).isoformat()
        msgs_ref.document(ai_msg_id).set({
            "role": "assistant",
            "content": ai_result.get("response", ""),
            "timestamp": ai_now,
            "analysis": ai_result.get("analysis", {}),
            "resources": json.loads(json.dumps(ai_result.get("resources", {}), default=str)),
        })

        # Update conversation metadata
        conv_data = conv_doc.to_dict()
        new_count = conv_data.get("message_count", 0) + 2
        update_data = {"updated_at": ai_now, "message_count": new_count}
        # Auto-title from first message
        if new_count <= 2:
            update_data["title"] = payload.message[:60] + ("..." if len(payload.message) > 60 else "")
        conv_ref.update(update_data)

        return {
            "user_message": {"id": user_msg_id, "role": "user", "content": payload.message, "timestamp": now},
            "assistant_message": {
                "id": ai_msg_id, "role": "assistant", "content": ai_result.get("response", ""),
                "timestamp": ai_now, "analysis": ai_result.get("analysis", {}),
                "resources": ai_result.get("resources", {}),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Conversation Trash Bin
# ---------------------------------------------------------------------------
@app.delete("/api/conversations/{conv_id}")
async def trash_conversation(conv_id: str, user: dict = Depends(get_current_user)):
    """Soft-delete a conversation by setting trashed_at timestamp."""
    try:
        conv_ref = db.collection("users").document(user["email"]).collection("conversations").document(conv_id)
        conv_doc = conv_ref.get()
        if not conv_doc.exists:
            raise HTTPException(status_code=404, detail="Conversation not found")
        conv_ref.update({"trashed_at": datetime.now(timezone.utc).isoformat()})
        return {"status": "success", "message": "Conversation moved to trash"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/conversations/trash/list")
async def list_trash(user: dict = Depends(get_current_user)):
    """List trashed conversations, auto-pruning those older than TRASH_RETENTION_DAYS."""
    try:
        convos_ref = db.collection("users").document(user["email"]).collection("conversations")
        docs = convos_ref.stream()
        result = []
        cutoff = datetime.now(timezone.utc) - timedelta(days=TRASH_RETENTION_DAYS)

        for doc in docs:
            data = doc.to_dict()
            trashed_at_str = data.get("trashed_at")
            if not trashed_at_str:
                continue

            trashed_at = datetime.fromisoformat(trashed_at_str)
            if trashed_at.tzinfo is None:
                trashed_at = trashed_at.replace(tzinfo=timezone.utc)

            if trashed_at < cutoff:
                # Auto-prune: permanently delete expired trash
                _delete_conversation_permanently(doc.reference)
                continue

            days_remaining = max(0, TRASH_RETENTION_DAYS - (datetime.now(timezone.utc) - trashed_at).days)
            result.append({
                "id": doc.id,
                "title": data.get("title", "Untitled"),
                "trashed_at": trashed_at_str,
                "days_remaining": days_remaining,
                "message_count": data.get("message_count", 0),
            })
        return {"trash": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/api/conversations/{conv_id}/restore")
async def restore_conversation(conv_id: str, user: dict = Depends(get_current_user)):
    """Restore a trashed conversation."""
    try:
        conv_ref = db.collection("users").document(user["email"]).collection("conversations").document(conv_id)
        conv_doc = conv_ref.get()
        if not conv_doc.exists:
            raise HTTPException(status_code=404, detail="Conversation not found")
        conv_ref.update({"trashed_at": None, "updated_at": datetime.now(timezone.utc).isoformat()})
        return {"status": "success", "message": "Conversation restored"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.delete("/api/conversations/trash/empty")
async def empty_trash(user: dict = Depends(get_current_user)):
    """Permanently delete all trashed conversations."""
    try:
        convos_ref = db.collection("users").document(user["email"]).collection("conversations")
        docs = convos_ref.stream()
        deleted_count = 0
        for doc in docs:
            data = doc.to_dict()
            if data.get("trashed_at"):
                _delete_conversation_permanently(doc.reference)
                deleted_count += 1
        return {"status": "success", "message": f"Permanently deleted {deleted_count} conversations"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def _delete_conversation_permanently(conv_ref):
    """Helper: delete a conversation document and all its message sub-documents."""
    try:
        msgs = conv_ref.collection("messages").stream()
        for msg_doc in msgs:
            msg_doc.reference.delete()
        conv_ref.delete()
    except Exception as e:
        print(f"Error permanently deleting conversation: {e}")


# ---------------------------------------------------------------------------
# Static Frontend
# ---------------------------------------------------------------------------
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
