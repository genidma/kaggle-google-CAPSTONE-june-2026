import json
import os
from typing import List, Dict, Any, Optional

class ServiceSearchAgent:
    """
    Service Search Agent:
    Responsible for querying the verified resource database to find accredited
    buddies and crisis line information based on availability and user needs.
    """

    def __init__(self, database_path: str = None):
        if database_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.database_path = os.path.join(base_dir, "data", "resources.json")
        else:
            self.database_path = database_path

        self.data = self._load_database()

    def _load_database(self) -> Dict[str, Any]:
        """Loads the resource directory from the JSON database."""
        try:
            if os.path.exists(self.database_path):
                with open(self.database_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            return {}
        except Exception as e:
            print(f"Error loading resource database: {e}")
            return {}

    def get_crisis_line(self) -> Dict[str, Any]:
        """Returns the general crisis/warmline contact information."""
        return self.data.get("general_crisis_line", {})

    def get_available_buddies(self) -> List[Dict[str, Any]]:
        """Returns all accredited buddies who are currently online/available."""
        buddies = self.data.get("accredited_buddies", [])
        return [b for b in buddies if b.get("availability", "").lower() == "online"]

    def get_all_buddies(self) -> List[Dict[str, Any]]:
        """Returns all accredited buddies regardless of availability."""
        return self.data.get("accredited_buddies", [])

    def get_buddy_by_id(self, buddy_id: str) -> Optional[Dict[str, Any]]:
        """Returns a specific buddy by their ID."""
        buddies = self.data.get("accredited_buddies", [])
        return next((b for b in buddies if b.get("id") == buddy_id), None)

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
