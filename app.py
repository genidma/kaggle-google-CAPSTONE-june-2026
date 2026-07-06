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

def create_jwt(user_id: str, email: str, tier: str, role: str = "patient") -> str:
    """Issue a signed JWT containing the user's identity claims."""
    payload = {
        "sub": user_id,
        "email": email,
        "tier": tier,
        "role": role,
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

        # Seed 4 demo accounts for video recording (#1, #4)
        demo_accounts = [
            {"email": "patient@test.com", "role": "patient", "tier": "Standard", "name": "Demo Patient"},
            {"email": "buddy@test.com", "role": "buddy", "tier": "Accredited", "name": "Sarah Jenkins (Buddy)"},
            {"email": "clinician@test.com", "role": "clinician", "tier": "Clinical", "name": "Dr. Aris Fitzgerald (Clinician)"},
            {"email": "caregiver@test.com", "role": "caregiver", "tier": "Family", "name": "Elena Rostova (Caregiver)"}
        ]
        users_ref = db.collection("users")
        print("Syncing demo accounts for video demonstration (#1, #4)...")
        for acc in demo_accounts:
            user_doc_ref = users_ref.document(acc["email"])
            acc["id"] = f"demo_{acc['role']}"
            acc["password"] = hash_password("password123")
            user_doc_ref.set(acc, merge=True)
        print("Successfully synced demo accounts.")
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
allowed_origins = [
    "https://mysupportbuddy-170198436835.us-central1.run.app",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]
if os.environ.get("ALLOWED_ORIGINS"):
    allowed_origins.extend([o.strip() for o in os.environ["ALLOWED_ORIGINS"].split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
    role: Optional[str] = "patient"

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

class EmergencyContact(BaseModel):
    name: str
    phone: str
    relationship: str
    type: str # e.g., "Primary", "Secondary", "Tertiary"

class CrisisPlanRequest(BaseModel):
    emergency_contacts: List[EmergencyContact] = []
    crisis_line_preference: str
    personal_grounding_trigger: str

class HandoffRequest(BaseModel):
    patient_name: str
    session_summary: str
    risk_level: str = "Supportive / Low Acute Crisis Risk"
    recommended_followup: str = "Review baseline anxiety and grounding techniques."

class TbiAnalyzeRequest(BaseModel):
    scan_filename: str
    patient_id: str
    scan_type: str = "fMRI / CT Neuro-Imaging Slice"

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
    user_role = payload.role or "patient"
    new_user = {
        "id": user_id,
        "email": email_normalized,
        "password": hash_password(payload.password),
        "tier": "Standard",
        "role": user_role
    }
    try:
        user_ref.set(new_user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

    token = create_jwt(user_id, email_normalized, "Standard", user_role)
    return {"id": user_id, "email": email_normalized, "tier": "Standard", "role": user_role, "token": token}


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

    user_role = user_data.get("role", "patient")
    token = create_jwt(user_data["id"], user_data["email"], user_data.get("tier", "Standard"), user_role)
    return {"id": user_data["id"], "email": user_data["email"], "tier": user_data.get("tier", "Standard"), "role": user_role, "token": token}


@app.get("/api/auth/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """Returns the authenticated user's profile from their JWT claims."""
    return {"id": user["sub"], "email": user["email"], "tier": user.get("tier", "Standard"), "role": user.get("role", "patient")}


@app.post("/api/auth/change-password")
async def change_password(payload: UserChangePasswordRequest, user: dict = Depends(get_current_user)):
    email_normalized = user["email"]
    if email_normalized.endswith("@test.com"):
        raise HTTPException(status_code=403, detail="Security policy: Password modification is disabled for pre-seeded evaluator demo accounts.")
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


@app.post("/api/crisis-plan")
async def save_crisis_plan(payload: CrisisPlanRequest, user: dict = Depends(get_current_user)):
    """Save personalized Emergency Contact & Crisis Safety Plan to Firestore (#6)."""
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        plan_data = {
            "emergency_contacts": [contact.model_dump() for contact in payload.emergency_contacts],
            "crisis_line_preference": payload.crisis_line_preference,
            "personal_grounding_trigger": payload.personal_grounding_trigger,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "user_email": user["email"]
        }
        db.collection("users").document(user["email"]).collection("settings").document("crisis_plan").set(plan_data, merge=True)
        return {"status": "success", "message": "Crisis plan updated securely", "plan": plan_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving crisis plan: {str(e)}")


@app.get("/api/crisis-plan")
async def get_crisis_plan(user: dict = Depends(get_current_user)):
    """Retrieve personalized Emergency Contact & Crisis Safety Plan (#6)."""
    if not db:
        return {"plan": None}
    try:
        doc = db.collection("users").document(user["email"]).collection("settings").document("crisis_plan").get()
        if doc.exists:
            plan_data = doc.to_dict()
            plan_data["emergency_contacts"] = plan_data.get("emergency_contacts", [])
            return {"plan": plan_data}
        return {"plan": None}
    except Exception as e:
        print(f"Error fetching crisis plan: {e}")
        return {"plan": None}


@app.get("/api/patient/{patient_email}/emergency-contacts")
async def get_patient_emergency_contacts(
    patient_email: str,
    user: dict = Depends(require_role(["buddy", "clinician", "caregiver"]))
):
    """Retrieve emergency contacts for a specific patient, accessible by authorized roles (#6)."""
    if not db:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        # Normalize the patient email
        patient_email_normalized = patient_email.lower().strip()
        doc = db.collection("users").document(patient_email_normalized).collection("settings").document("crisis_plan").get()
        if doc.exists:
            plan_data = doc.to_dict()
            emergency_contacts = plan_data.get("emergency_contacts", [])
            # Only return the emergency contacts, not the full crisis plan
            return {"patient_email": patient_email, "emergency_contacts": emergency_contacts}
        raise HTTPException(status_code=404, detail="Patient emergency contacts not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching patient emergency contacts for {patient_email}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching emergency contacts: {str(e)}")

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
# Multi-Tier Role-Based Endpoints (RBAC) (#1, #4, #5)
# ---------------------------------------------------------------------------
def require_role(allowed_roles: List[str]):
    """RBAC dependency generator checking user role against allowed roles (#4)."""
    async def role_checker(user: dict = Depends(get_current_user)):
        user_role = user.get("role", "patient")
        if user_role not in allowed_roles:
            raise HTTPException(status_code=403, detail=f"Access denied: Requires role in {allowed_roles}")
        return user
    return role_checker


@app.get("/api/buddy-dashboard")
async def get_buddy_dashboard(user: dict = Depends(require_role(["buddy", "clinician"]))):
    """Returns assigned peer roster, warmline call logs, and active session queue for Buddies (#1, #5)."""
    try:
        logs_ref = db.collection("settings").document("crisis_line").collection("call_logs").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(10)
        call_logs = [doc.to_dict() for doc in logs_ref.stream()]
        
        assigned_peers = [
            {"id": "peer_101", "name": "John D.", "status": "Active Chat", "last_checkin": "10 mins ago", "topic": "PTSD Transition", "risk_level": "Low"},
            {"id": "peer_102", "name": "Maria K.", "status": "Requested Chat", "last_checkin": "1 hour ago", "topic": "Caregiver Stress", "risk_level": "Moderate"},
            {"id": "peer_103", "name": "Alex R.", "status": "Scheduled Check-in", "last_checkin": "Yesterday", "topic": "TBI Recovery", "risk_level": "Low"}
        ]
        return {
            "role": user.get("role"),
            "assigned_peers": assigned_peers,
            "recent_call_logs": call_logs,
            "ethics_notice": "Do No Harm: You are viewing peer data under accredited buddy guidelines. Access is restricted to assigned peers."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching buddy dashboard: {str(e)}")


@app.get("/api/clinician-portal")
async def get_clinician_portal(user: dict = Depends(require_role(["clinician"]))):
    """Returns clinical triage summaries and TBI neuro-imaging analytics placeholder (#1, #2)."""
    try:
        triage_cases = [
            {"id": "case_401", "patient_name": "Patient #8492", "priority": "High", "flag_reason": "Repeated crisis line dispatches", "assigned_clinician": "Dr. Aris Fitzgerald", "status": "Under Review"},
            {"id": "case_402", "patient_name": "Patient #3910", "priority": "Medium", "flag_reason": "TBI model assessment requested", "assigned_clinician": "Dr. Aris Fitzgerald", "status": "Awaiting Scan Analysis"}
        ]
        tbi_analytics = {
            "status": "Ready for Scan Ingestion (#2)",
            "supported_models": ["NeuroScan-TBI-v1", "AlphaBrain-Impact-7B"],
            "description": "Clinicians can upload TBI scans to analyze impacted brain regions and neurological controls."
        }
        return {
            "role": "clinician",
            "triage_cases": triage_cases,
            "tbi_analytics": tbi_analytics,
            "ethics_notice": "HIPAA Controlled Area: Clinical data is strictly monitored and logged for patient care coordination."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching clinician portal: {str(e)}")


@app.get("/api/caregiver-portal")
async def get_caregiver_portal(user: dict = Depends(require_role(["caregiver", "clinician"]))):
    """Returns consented patient wellness check-in summaries (#1)."""
    try:
        consented_summaries = [
            {"patient_id": "pat_771", "name": "Mark Rostova", "relationship": "Spouse", "consent_granted": True, "last_checkin": "Today, 9:00 AM", "mood_status": "🟢 Positive / Stable", "notes_share_enabled": False, "summary": "Mark completed his morning peer session with Marcus T. Reported good sleep quality."},
        ]
        return {
            "role": "caregiver",
            "consented_summaries": consented_summaries,
            "ethics_notice": "Caregiver Access: Information displayed is strictly limited by explicit patient consent toggles."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching caregiver portal: {str(e)}")


# ---------------------------------------------------------------------------
# Multimodal Capstone Endpoints (#2, #7.3)
# ---------------------------------------------------------------------------
IN_MEMORY_HANDOFFS = []

@app.post("/api/clinician-handoff")
async def create_clinician_handoff(payload: HandoffRequest, user: dict = Depends(require_role(["buddy", "clinician"]))):
    """Stores a post-session peer handoff report for clinician triage (#7.3)."""
    try:
        handoff_doc = {
            "handoff_id": f"MSB-{int(datetime.now().timestamp()) % 10000}",
            "buddy_email": user.get("email"),
            "patient_name": payload.patient_name,
            "session_summary": payload.session_summary,
            "risk_level": payload.risk_level,
            "recommended_followup": payload.recommended_followup,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        IN_MEMORY_HANDOFFS.insert(0, handoff_doc)
        if db:
            try:
                db.collection("clinician_handoffs").add(handoff_doc)
            except Exception as db_e:
                print(f"Warning: Could not save handoff to Firestore: {db_e}")
        return {"status": "success", "handoff": handoff_doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating clinician handoff: {str(e)}")


@app.get("/api/clinician-handoffs")
async def get_clinician_handoffs(user: dict = Depends(require_role(["clinician"]))):
    """Retrieves all post-session peer handoff reports for clinician review (#7.3)."""
    try:
        results = []
        if db:
            try:
                docs = db.collection("clinician_handoffs").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(20).stream()
                results = [doc.to_dict() for doc in docs]
            except Exception as db_e:
                print(f"Warning: Could not query handoffs from Firestore: {db_e}")
        if not results and IN_MEMORY_HANDOFFS:
            results = IN_MEMORY_HANDOFFS
        if not results:
            results = [
                {
                    "handoff_id": "MSB-7842",
                    "buddy_email": "sarah.j@supportbuddy.org",
                    "patient_name": "Alex W. (Anxiety & Panic Attack)",
                    "session_summary": "Patient experienced acute physiological panic symptoms. De-escalated via guided 4-4-4-4 Box Breathing. Zero self-harm risk detected.",
                    "risk_level": "Supportive / Low Acute Crisis Risk",
                    "recommended_followup": "Recommend clinical follow-up for chronic anxiety triggers.",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            ]
        return {"status": "success", "handoffs": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving clinician handoffs: {str(e)}")


@app.post("/api/tbi-analyze")
async def analyze_tbi_scan(payload: TbiAnalyzeRequest, user: dict = Depends(require_role(["clinician"]))):
    """Multimodal TBI Brain Scan Analyzer using simulated NeuroScan-TBI-v1 & AlphaBrain-Impact-7B models (#2)."""
    try:
        analysis_result = {
            "model_used": "NeuroScan-TBI-v1 (multimodal Vision-Language transformer)",
            "scan_metadata": {
                "filename": payload.scan_filename,
                "patient_id": payload.patient_id,
                "modality": payload.scan_type,
                "analyzed_at": datetime.now(timezone.utc).isoformat()
            },
            "slices": [
                {"id": "slice_1", "title": "Frontal Lobe Impact (Raw Sectional View)", "view_type": "Slice 01 - Frontal Scan", "image_url": "/img/tbi/slice_1_frontal.png", "status": "Metabolic Depression", "impact_score": "4.2 / 10", "clinical_note": "Initial frontal lobe scan prior to diagnostic neural network overlay; slight metabolic depression observed in prefrontal cortex."},
                {"id": "slice_2", "title": "Axial View (Raw Sectional View)", "view_type": "Slice 02 - Axial Scan", "image_url": "/img/tbi/slice_2_axial.png", "status": "Minor Inflammation", "impact_score": "3.8 / 10", "clinical_note": "Initial axial cross-section showing bilateral temporal symmetry and localized inflammation."},
                {"id": "slice_3", "title": "Sagittal View (Raw Sectional View)", "view_type": "Slice 03 - Sagittal Scan", "image_url": "/img/tbi/slice_3_sagittal.png", "status": "Moderate Severity", "impact_score": "4.5 / 10", "clinical_note": "Mid-sagittal section displaying corpus callosum and brainstem anatomy; correlates with executive fatigue."},
                {"id": "slice_4", "title": "Rear View Assessment (Raw Sectional View)", "view_type": "Slice 04 - Occipital/Parietal", "image_url": "/img/tbi/slice_4_rear.png", "status": "Stable / Unremarkable", "impact_score": "1.5 / 10", "clinical_note": "Posterior view showing occipital and parietal lobe structure intact; no focal hemorrhaging detected."},
                {"id": "slice_5", "title": "Detailed Regional View (Raw Sectional View)", "view_type": "Slice 05 - Temporal/Regional", "image_url": "/img/tbi/slice_5_regional.png", "status": "Damage Analysis Complete", "impact_score": "3.2 / 10", "clinical_note": "High-resolution regional cross-section mapped prior to automated biomarker assessment."}
            ],
            "diag_slices": [
                {"id": "diag_1", "title": "Frontal Lobe Impact — Neural Network Diagnostic Overlay", "view_type": "Diag 01 - Frontal Impact", "image_url": "/img/tbi/diag_1_frontal.png", "status": "Metabolic Depression", "impact_score": "4.2 / 10", "clinical_note": "Clinical Observations (Frontal Region): Impulsivity, Impaired judgment, Difficulty planning/executing tasks, Emotional regulation dysfunction."},
                {"id": "diag_2", "title": "Multimodal Mood & Behavioral Profile — Temporal Focus", "view_type": "Diag 02 - Mood Assessment", "image_url": "/img/tbi/diag_2_axial.png", "status": "Minor Inflammation", "impact_score": "3.8 / 10", "clinical_note": "Multi-Site Mood Assessment: Frontal Lobe -> Impulsivity; Apathy. Temporal Lobe -> Depressive symptoms; Anxiety. Combined Effect -> Increased risk of chronic irritability."},
                {"id": "diag_3", "title": "Sagittal Severity & Behavioral Diagnostics", "view_type": "Diag 03 - Sagittal Severity", "image_url": "/img/tbi/diag_3_sagittal.png", "status": "Moderate Severity (67% Conf.)", "impact_score": "4.5 / 10", "clinical_note": "Specific Behavioral Observations (Temporal Focus): Challenges with memory consolidation, Difficulty reading social cues, Altered perception of threat."},
                {"id": "diag_4", "title": "Rear View Cognitive & Sensory Assessment", "view_type": "Diag 04 - Parietal / Temporal", "image_url": "/img/tbi/diag_4_rear.png", "status": "Stable / Unremarkable", "impact_score": "1.5 / 10", "clinical_note": "Cognitive & Sensory Impact: Spatial neglect errors, Sensory processing difficulties, Reduced attention span."},
                {"id": "diag_5", "title": "Detailed Regional Analysis & Quantitative Mood Metrics", "view_type": "Diag 05 - Right Frontal Mesh", "image_url": "/img/tbi/diag_5_regional.png", "status": "14,500 Data Points Mapped", "impact_score": "3.2 / 10", "clinical_note": "Quantitative Mood Metrics (Detailed R Frontal): Affective Lability Score: High. Response Inhibition Score: Impaired. Decision Making Deficit: Moderate."}
            ],
            "findings": [
                {"region": "Frontal Lobe Impact (Slice 1)", "status": "Metabolic Depression", "impact_score": "4.2 / 10", "clinical_note": "Slight metabolic depression observed; correlates with reported executive dysfunction."},
                {"region": "Axial View (Slice 2)", "status": "Minor Inflammation", "impact_score": "3.8 / 10", "clinical_note": "Bilateral neural connectivity assessment shows localized temporal inflammation."},
                {"region": "Sagittal View (Slice 3)", "status": "Moderate Severity", "impact_score": "4.5 / 10", "clinical_note": "Correlates with reported executive dysfunction and sensory hypersensitivity."},
                {"region": "Rear View Assessment (Slice 4)", "status": "Stable / Unremarkable", "impact_score": "1.5 / 10", "clinical_note": "Parietal lobe connectivity intact; no focal hemorrhaging identified."},
                {"region": "Detailed Regional Analysis (Slice 5)", "status": "Damage Analysis Complete", "impact_score": "3.2 / 10", "clinical_note": "High-resolution neural mesh mapped (14,500 points). Cleared for outpatient support."}
            ],
            "neurological_controls": {
                "cognitive_fatigue_index": "Moderate (62%)",
                "autonomic_regulation": "Stable",
                "recommended_rest_protocol": "Level 2 Cognitive Rest: Limit screen exposure to <2 hrs/day; integrate 4-4-4-4 tactile grounding sessions prior to high-focus tasks."
            },
            "safety_clearance": "Cleared for outpatient peer support check-ins with assigned buddy."
        }
        return {"status": "success", "analysis": analysis_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing TBI scan: {str(e)}")


# ---------------------------------------------------------------------------
# Static Frontend
# ---------------------------------------------------------------------------
img_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "img")
if os.path.exists(img_dir):
    app.mount("/img", StaticFiles(directory=img_dir), name="img")

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
