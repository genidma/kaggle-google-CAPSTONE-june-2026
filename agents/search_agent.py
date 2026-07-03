import json
import os
from typing import List, Dict, Any

class ServiceSearchAgent:
    """
    Service Search Agent:
    Responsible for querying the verified resource database to find support services
    matching specific categories and geographic locations.
    """
    
    def __init__(self, database_path: str = None):
        if database_path is None:
            # Resolve path relative to project root
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.database_path = os.path.join(base_dir, "data", "resources.json")
        else:
            self.database_path = database_path
            
        self.resources = self._load_database()

    def _load_database(self) -> List[Dict[str, Any]]:
        """Loads verified resource listings from the JSON database."""
        try:
            if os.path.exists(self.database_path):
                with open(self.database_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            return []
        except Exception as e:
            print(f"Error loading resource database: {e}")
            return []

    def search(self, category: str, location: str) -> List[Dict[str, Any]]:
        """
        Queries the database for matching services based on category and location.
        
        Args:
            category (str): The resource category (e.g., 'mental_health', 'shelter', 'food_assistance').
            location (str): The user's location query (e.g., 'New York', 'San Francisco', 'Chicago').
            
        Returns:
            List[Dict[str, Any]]: Filtered and ranked resource listings.
        """
        # Normalize category
        category = category.lower().strip() if category else ""
        
        # Normalize location
        location_norm = location.lower().strip() if location else ""
        
        matches = []
        for resource in self.resources:
            # Check category match (if category is specified)
            category_match = True
            if category:
                # Direct match or substring match
                category_match = (
                    category in resource.get("category", "").lower() or 
                    resource.get("category", "").lower() in category
                )
            
            # Check location match (if location is specified)
            location_match = True
            if location_norm:
                city = resource.get("city", "").lower()
                state = resource.get("state", "").lower()
                zip_code = resource.get("zip_code", "").lower()
                address = resource.get("address", "").lower()
                
                # Check if the query location matches city, state, zip code, or address
                location_match = (
                    location_norm in city or
                    location_norm in state or
                    location_norm in zip_code or
                    location_norm in address or
                    any(word in address for word in location_norm.split())
                )
            
            if category_match and location_match:
                matches.append(resource)
                
        return matches
