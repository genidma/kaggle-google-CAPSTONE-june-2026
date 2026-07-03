import os
from fastapi import FastAPI, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Load local environment variables from .env if present
load_dotenv()

from agents.orchestrator import OrchestratorAgent
from agents.search_agent import ServiceSearchAgent

app = FastAPI(
    title="Crisis Support Matching Directory API",
    description="Orchestrates safety checks, intent analysis, and local resource matching.",
    version="1.0.0"
)

# Instantiate global agents (using system/server key if available)
search_agent = ServiceSearchAgent()
default_orchestrator = OrchestratorAgent(search_agent=search_agent)

class QueryRequest(BaseModel):
    query: str
    custom_api_key: str = None

@app.post("/api/match")
async def match_services(payload: QueryRequest):
    """
    Main matching endpoint. Takes user's input query, extracts entities/intent, 
    verifies safety, queries resource database, and synthesizes output.
    Allows dynamic user/judge provided API keys to bypass API quotas.
    """
    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query text cannot be empty.")
        
    try:
        # Determine orchestrator to use: 
        # If user/judge provides a custom API key, spin up a transient orchestrator with it.
        # Otherwise, fall back to the default system-level orchestrator.
        if payload.custom_api_key and payload.custom_api_key.strip():
            # Override GEMINI_API_KEY for this request
            # Store original key to restore later
            original_key = os.environ.get("GEMINI_API_KEY")
            try:
                os.environ["GEMINI_API_KEY"] = payload.custom_api_key.strip()
                transient_orchestrator = OrchestratorAgent(search_agent=search_agent)
                result = transient_orchestrator.process_request(payload.query)
            finally:
                # Restore original key
                if original_key:
                    os.environ["GEMINI_API_KEY"] = original_key
                else:
                    os.environ.pop("GEMINI_API_KEY", None)
        else:
            result = default_orchestrator.process_request(payload.query)
            
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/resources")
async def list_resources(category: str = None, location: str = None):
    """Lists all available services, optionally filtered by category or location."""
    try:
        resources = search_agent.search(category=category, location=location)
        return {"resources": resources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Serve static frontend files
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    @app.get("/")
    async def root_fallback():
        return {"message": "Crisis Support Directory API. Static frontend directory not found."}

if __name__ == "__main__":
    import uvicorn
    # Default to port 8080 (standard for Cloud Run) but allow env overrides
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
