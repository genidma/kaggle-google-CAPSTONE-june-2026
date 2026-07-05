import json
import os
from typing import List, Dict, Any, Optional
from google.cloud import firestore
from google.cloud.firestore import FieldFilter

class ServiceSearchAgent:
    """
    Service Search Agent:
    Responsible for querying the verified resource database in Google Cloud Firestore
    to find accredited buddies and crisis line information.
    """

    def __init__(self):
        self.db = firestore.Client(project="kaggle-june-2026-capstone")

    def get_crisis_line(self) -> Dict[str, Any]:
        """Returns the general crisis/warmline contact information from Firestore."""
        try:
            doc = self.db.collection("settings").document("crisis_line").get()
            if doc.exists:
                return doc.to_dict()
        except Exception as e:
            print(f"Error fetching crisis line from Firestore: {e}")
        
        # Fallback to default crisis line configuration
        return {
            "name": "General Support & Listening Warmline",
            "phone": "1-877-WARMLINE (1-877-927-6546)",
            "description": "Professional, confidential warmline for supportive listening, stress, loneliness, and life challenges. Non-emergency assistance.",
            "hours": "24/7/365"
        }

    def get_available_buddies(self) -> List[Dict[str, Any]]:
        """Returns all accredited buddies who are currently online/available from Firestore."""
        try:
            query = self.db.collection("buddies").where(filter=FieldFilter("availability", "==", "Online"))
            return [doc.to_dict() for doc in query.stream()]
        except Exception as e:
            print(f"Error fetching available buddies from Firestore: {e}")
            return []

    def get_all_buddies(self) -> List[Dict[str, Any]]:
        """Returns all accredited buddies regardless of availability from Firestore."""
        try:
            return [doc.to_dict() for doc in self.db.collection("buddies").stream()]
        except Exception as e:
            print(f"Error fetching all buddies from Firestore: {e}")
            return []

    def get_buddy_by_id(self, buddy_id: str) -> Optional[Dict[str, Any]]:
        """Returns a specific buddy by their ID from Firestore."""
        try:
            doc = self.db.collection("buddies").document(buddy_id).get()
            if doc.exists:
                return doc.to_dict()
        except Exception as e:
            print(f"Error fetching buddy {buddy_id} from Firestore: {e}")
        return None

    def search(self, needs_crisis_line: bool = False) -> Dict[str, Any]:
        """
        Main search method called by the Orchestrator.

        Args:
            needs_crisis_line: If True, include the crisis line prominently in results.

        Returns:
            Dict containing crisis_line and matched buddies.
        """
        return {
            "crisis_line": self.get_crisis_line(),
            "available_buddies": self.get_available_buddies(),
            "all_buddies": self.get_all_buddies(),
            "needs_crisis_line": needs_crisis_line
        }
