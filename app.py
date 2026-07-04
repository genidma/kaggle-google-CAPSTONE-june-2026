import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from agents.orchestrator import OrchestratorAgent
from agents.search_agent import ServiceSearchAgent

app = FastAPI(
    title="MySupportBuddy - Peer Support & Crisis Resource API",
    description="Routes users to accredited peer support buddies or the general warmline, with privacy-protected buddy notifications.",
    version="2.0.0"
)

search_agent = ServiceSearchAgent()
default_orchestrator = OrchestratorAgent(search_agent=search_agent)


class MessageRequest(BaseModel):
    message: str
    custom_api_key: str = None


class CrisisCallRequest(BaseModel):
    buddy_id: str
    duration_minutes: int
    timestamp: str


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
