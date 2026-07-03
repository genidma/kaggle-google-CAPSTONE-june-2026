import os
import json
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from google.genai.errors import APIError

from agents.search_agent import ServiceSearchAgent

class CrisisAnalysis(BaseModel):
    is_crisis: bool = Field(
        description="Whether the query represents a crisis situation requiring support (e.g. food, housing, shelter, mental health, abuse)."
    )
    severe_crisis: bool = Field(
        description="Whether the query represents an immediate life-threatening emergency (e.g. active self-harm, medical emergency, active abuse)."
    )
    category: str = Field(
        description="The primary category of support needed. Must be one of: 'mental_health', 'food_assistance', 'shelter', 'medical', 'other'."
    )
    location: str = Field(
        description="The extracted geographic location (city, state, zip code, or address) mentioned in the query. Leave empty if none is mentioned."
    )
    needs_description: str = Field(
        description="A concise summary of what the user is seeking."
    )

class OrchestratorAgent:
    """
    Orchestrator Agent:
    Manages user intent, screens queries for safety and crisis severity,
    coordinates with the ServiceSearchAgent, and synthesizes the final guide.
    """
    
    def __init__(self, search_agent: ServiceSearchAgent = None):
        self.search_agent = search_agent or ServiceSearchAgent()
        
        # Initialize Gemini Client if API key is present
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
        
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Error initializing Google GenAI Client: {e}")
                self.client = None
        else:
            print("Warning: GEMINI_API_KEY not found in environment. Running in sandbox/fallback mode.")
            self.client = None

    def analyze_query(self, user_query: str) -> CrisisAnalysis:
        """
        Uses Gemini Structured Outputs to classify and extract information from the query.
        Falls back to rule-based heuristics if the API call fails or is unconfigured.
        """
        if not self.client:
            return self._fallback_analyze(user_query)
            
        system_prompt = (
            "You are the Security & Intent Analyzer for a crisis support directory. "
            "Examine the user query to classify the type of crisis assistance requested, "
            "assess the severity, and extract locations or entities to search for support services. "
            "Be conservative with severity: if self-harm, suicide, or active threat is mentioned, set severe_crisis to True."
        )
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=user_query,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=CrisisAnalysis,
                    system_instruction=system_prompt,
                    temperature=0.0
                )
            )
            # Parse response json
            data = json.loads(response.text)
            return CrisisAnalysis(**data)
        except Exception as e:
            print(f"GenAI API Error: {e}. Falling back to heuristics.")
            return self._fallback_analyze(user_query)

    def _fallback_analyze(self, query: str) -> CrisisAnalysis:
        """Rule-based heuristic parsing when API is unavailable."""
        query_lower = query.lower()
        
        # Heuristics for severe crisis
        severe_keywords = ["suicide", "kill myself", "harm myself", "ending my life", "abuse", "beaten", "domestic violence", "911", "dying"]
        severe_crisis = any(kw in query_lower for kw in severe_keywords)
        
        # Heuristics for category
        category = "other"
        if any(kw in query_lower for kw in ["depressed", "anxious", "mental", "sad", "crying", "therapy", "suicidal", "psychology", "lonely"]):
            category = "mental_health"
        elif any(kw in query_lower for kw in ["food", "hungry", "eat", "pantry", "meals", "groceries", "starving"]):
            category = "food_assistance"
        elif any(kw in query_lower for kw in ["shelter", "homeless", "housing", "rent", "sleep", "bed"]):
            category = "shelter"
        elif any(kw in query_lower for kw in ["doctor", "medical", "hospital", "clinic", "pain", "hurt", "injury"]):
            category = "medical"
            
        # Heuristics for location
        location = ""
        if "new york" in query_lower or "nyc" in query_lower:
            location = "New York"
        elif "san francisco" in query_lower or "sf" in query_lower:
            location = "San Francisco"
        elif "chicago" in query_lower:
            location = "Chicago"
            
        is_crisis = severe_crisis or category != "other" or "help" in query_lower
        
        return CrisisAnalysis(
            is_crisis=is_crisis,
            severe_crisis=severe_crisis,
            category=category,
            location=location,
            needs_description=f"Fallback parsed: {query[:50]}"
        )

    def process_request(self, user_query: str) -> Dict[str, Any]:
        """
        Main processing pipeline:
        1. Safety Analysis
        2. Delegation to ServiceSearchAgent
        3. Response synthesis
        """
        # Step 1: Analyze query
        analysis = self.analyze_query(user_query)
        
        # Immediate life safety warning if severe crisis
        if analysis.severe_crisis:
            return {
                "status": "severe_crisis",
                "analysis": analysis.model_dump(),
                "response": (
                    "IMMEDIATE ASSISTANCE REQUIRED: If you are in immediate danger or experiencing a life-threatening emergency, "
                    "please call 911 or go to the nearest emergency room immediately.\n\n"
                    "For free, confidential, 24/7 support in a suicide or mental health crisis, please call or text 988 "
                    "to reach the Suicide & Crisis Lifeline (in the US/Canada)."
                ),
                "resources": []
            }
            
        if not analysis.is_crisis:
            return {
                "status": "non_crisis",
                "analysis": analysis.model_dump(),
                "response": (
                    "I am programmed to assist primarily with crisis matching (food, shelter, mental health, and emergency medical services). "
                    "If you are seeking general information, please let me know how I can guide you towards support services."
                ),
                "resources": []
            }
            
        # Step 2: Query database using ServiceSearchAgent
        resources = self.search_agent.search(category=analysis.category, location=analysis.location)
        
        # Step 3: Synthesize guidance
        response_text = self._synthesize_response(analysis, resources)
        
        return {
            "status": "success",
            "analysis": analysis.model_dump(),
            "response": response_text,
            "resources": resources
        }

    def _synthesize_response(self, analysis: CrisisAnalysis, resources: List[Dict[str, Any]]) -> str:
        """Generates an empathetic and informative matching summary."""
        category_label = analysis.category.replace("_", " ").title()
        
        if not resources:
            location_clause = f" in '{analysis.location}'" if analysis.location else ""
            return (
                f"We identified a request for **{category_label}** support{location_clause}.\n\n"
                "Unfortunately, we did not find direct matches in our verified directory for this specific location. "
                "However, you can connect with national helplines for immediate guidance:\n\n"
                "* **988 Suicide & Crisis Lifeline**: Call or text 988 (Confidential, 24/7 support)\n"
                "* **211 Essential Community Services**: Call 211 or visit 211.org to find local resources for food, shelter, and utilities."
            )
            
        location_str = f" in **{analysis.location}**" if analysis.location else ""
        intro = (
            f"Based on your request, I matched your query to verified **{category_label}** resources{location_str}.\n\n"
            f"Here are the local verified support services that match your needs:"
        )
        
        return intro
