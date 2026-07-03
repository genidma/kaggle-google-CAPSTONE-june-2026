import os
import json
from typing import Dict, Any
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

from agents.search_agent import ServiceSearchAgent


class SupportAnalysis(BaseModel):
    needs_support: bool = Field(
        description="Whether the user is expressing a need for emotional support, stress relief, or general wellbeing help."
    )
    needs_crisis_line: bool = Field(
        description="Whether the user may benefit from connecting directly with a professional crisis line (e.g. mentions feeling overwhelmed, alone, or in distress)."
    )
    urgency_level: str = Field(
        description="Urgency level of the request. Must be one of: 'low' (general chat/loneliness), 'medium' (stress/anxiety/sadness), 'high' (in distress, needs immediate human support)."
    )
    summary: str = Field(
        description="A brief, empathetic one-sentence summary of what the user seems to be experiencing."
    )
    suggested_action: str = Field(
        description="Suggested next step: 'connect_buddy' (talk to an accredited buddy), 'use_crisis_line' (call the warmline), or 'both' (offer both options)."
    )


class OrchestratorAgent:
    """
    Orchestrator Agent:
    - Screens user messages for emotional support needs.
    - Triages between recommending an Accredited Buddy vs. the General Crisis Line.
    - Manages the privacy-protected crisis call notification pipeline (metadata only).
    """

    def __init__(self, search_agent: ServiceSearchAgent = None):
        self.search_agent = search_agent or ServiceSearchAgent()

        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Error initializing Google GenAI Client: {e}")
                self.client = None
        else:
            print("Warning: GEMINI_API_KEY not found. Running in sandbox/fallback mode.")
            self.client = None

    def analyze_message(self, user_message: str) -> SupportAnalysis:
        """
        Uses Gemini Structured Outputs to classify the user's support need.
        Falls back to rule-based heuristics if API is unavailable.
        """
        if not self.client:
            return self._fallback_analyze(user_message)

        system_prompt = (
            "You are the Triage Coordinator for a peer-support buddy platform called MATCH. "
            "Your role is to gently and empathetically assess what kind of support the user needs. "
            "The platform connects users with accredited peer support buddies for general emotional support, "
            "and with a professional warmline when the user is feeling significantly distressed. "
            "Classify the user's message carefully. Always be compassionate and non-judgmental."
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=user_message,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SupportAnalysis,
                    system_instruction=system_prompt,
                    temperature=0.0
                )
            )
            data = json.loads(response.text)
            return SupportAnalysis(**data)
        except Exception as e:
            print(f"GenAI API Error: {e}. Falling back to heuristics.")
            return self._fallback_analyze(user_message)

    def _fallback_analyze(self, message: str) -> SupportAnalysis:
        """Rule-based heuristic triage when API is unavailable."""
        msg = message.lower()

        crisis_keywords = ["overwhelmed", "can't cope", "cannot cope", "hopeless", "desperate",
                           "alone", "no one cares", "need help now", "breaking down", "falling apart"]
        medium_keywords = ["stressed", "anxious", "sad", "worried", "struggling", "not okay",
                           "difficult", "hard time", "feeling low", "upset"]

        needs_crisis = any(kw in msg for kw in crisis_keywords)
        needs_medium = any(kw in msg for kw in medium_keywords)
        needs_support = needs_crisis or needs_medium or "help" in msg or "talk" in msg

        if needs_crisis:
            urgency = "high"
            action = "both"
        elif needs_medium:
            urgency = "medium"
            action = "connect_buddy"
        else:
            urgency = "low"
            action = "connect_buddy"

        return SupportAnalysis(
            needs_support=needs_support,
            needs_crisis_line=needs_crisis,
            urgency_level=urgency,
            summary=f"User seems to be seeking support. (Fallback analysis: '{message[:60]}...')" if len(message) > 60 else f"User: '{message}'",
            suggested_action=action
        )

    def process_request(self, user_message: str) -> Dict[str, Any]:
        """
        Main processing pipeline:
        1. Analyze the user's message and triage their needs.
        2. Delegate to ServiceSearchAgent to find appropriate resources.
        3. Synthesize an empathetic, actionable response.
        """
        analysis = self.analyze_message(user_message)

        if not analysis.needs_support:
            return {
                "status": "general_inquiry",
                "analysis": analysis.model_dump(),
                "response": (
                    "Hello! I'm MATCH, a peer-support platform. I'm here to connect you with "
                    "accredited support buddies or a professional warmline whenever you need someone to talk to. "
                    "Feel free to share what's on your mind."
                ),
                "resources": {}
            }

        # Query the ServiceSearchAgent
        resources = self.search_agent.search(
            needs_crisis_line=(analysis.suggested_action in ["use_crisis_line", "both"])
        )

        response_text = self._synthesize_response(analysis)

        return {
            "status": "success",
            "analysis": analysis.model_dump(),
            "response": response_text,
            "resources": resources
        }

    def _synthesize_response(self, analysis: SupportAnalysis) -> str:
        """Generates a warm, empathetic, action-oriented response."""
        base = f"**{analysis.summary}**\n\n"

        if analysis.suggested_action == "connect_buddy":
            return (
                base +
                "It sounds like you could use someone to talk to right now, and that's completely okay. "
                "We have accredited peer support buddies available who are here to listen — "
                "no judgment, just a caring ear. Would you like to connect with one of them?"
            )
        elif analysis.suggested_action == "use_crisis_line":
            return (
                base +
                "Thank you for reaching out — it takes courage. When things feel overwhelming, "
                "connecting with a professional warmline can make a real difference. "
                "Our General Support Warmline is available 24/7 and completely confidential. "
                "Your buddy will know you reached out (but not what was discussed), "
                "so they can check in on you afterward."
            )
        else:  # both
            return (
                base +
                "I'm really glad you reached out. We want to make sure you have all the support you need right now. "
                "You can connect with one of our caring peer buddies for a warm conversation, "
                "or reach the General Support Warmline directly for professional, confidential support. "
                "Your buddy will be notified that you used the warmline (but not the details), "
                "so they can follow up with you."
            )

    def log_crisis_call(self, buddy_id: str, duration_minutes: int, timestamp: str) -> Dict[str, Any]:
        """
        Privacy-protected crisis call logger.
        Records ONLY metadata (time, duration) visible to the buddy.
        The actual conversation content is never stored or shared.
        """
        buddy = self.search_agent.get_buddy_by_id(buddy_id)
        if not buddy:
            return {"status": "error", "message": "Buddy not found."}

        notification = {
            "buddy_id": buddy_id,
            "buddy_name": buddy.get("name"),
            "event": "warmline_call",
            "timestamp": timestamp,
            "duration_minutes": duration_minutes,
            "privacy_note": "Call content is confidential and has not been recorded or shared.",
            "suggested_buddy_action": (
                f"Your matched user connected with the Support Warmline on {timestamp} "
                f"for approximately {duration_minutes} minute(s). "
                "Consider checking in with them when they're ready. Their conversation remains private."
            )
        }

        return {"status": "success", "notification": notification}
