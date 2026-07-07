import sys
import json
import os

# Load resources from data/resources.json
RESOURCES_PATH = os.path.join(os.path.dirname(__file__), "data", "resources.json")

def load_resources_data():
    try:
        with open(RESOURCES_PATH, "r") as f:
            return json.load(f)
    except Exception as e:
        return {}

def send_response(response_id, result=None, error=None):
    resp = {"jsonrpc": "2.0", "id": response_id}
    if error:
        resp["error"] = error
    else:
        resp["result"] = result
    sys.stdout.write(json.dumps(resp) + "\n")
    sys.stdout.flush()

def handle_message(line):
    try:
        request = json.loads(line)
    except Exception:
        # Silently discard malformed JSON lines
        return

    if "method" not in request:
        return

    method = request.get("method")
    req_id = request.get("id")

    if method == "initialize":
        result = {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "resources": {},
                "tools": {}
            },
            "serverInfo": {
                "name": "mysupportbuddy-mcp-server",
                "version": "1.0.0"
            }
        }
        send_response(req_id, result)

    elif method == "notifications/initialized":
        # Handshake finished confirmation (no response message returned)
        pass

    elif method == "resources/list":
        result = {
            "resources": [
                {
                    "uri": "buddies://directory",
                    "name": "Accredited Peer Buddies Directory",
                    "mimeType": "application/json",
                    "description": "Directory of all certified peer support buddies available on MySupportBuddy."
                },
                {
                    "uri": "crisis://resources",
                    "name": "General Listening Warmline & Crisis Contacts",
                    "mimeType": "application/json",
                    "description": "Standard contact details and referral resources for crisis support."
                }
            ]
        }
        send_response(req_id, result)

    elif method == "resources/read":
        uri = request.get("params", {}).get("uri")
        data = load_resources_data()
        if uri == "buddies://directory":
            text_content = json.dumps(data.get("accredited_buddies", []), indent=2)
        elif uri == "crisis://resources":
            text_content = json.dumps(data.get("general_crisis_line", {}), indent=2)
        else:
            send_response(req_id, error={"code": -32602, "message": f"Resource not found: {uri}"})
            return

        result = {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": text_content
                }
            ]
        }
        send_response(req_id, result)

    elif method == "tools/list":
        result = {
            "tools": [
                {
                    "name": "lookup_buddy_specialties",
                    "description": "Search peer support buddies by specialty category (e.g. Crisis, Anxiety, Depression, PTSD).",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "specialty": {
                                "type": "string",
                                "description": "Specialty keyword to filter buddies (case-insensitive)"
                            }
                        },
                        "required": ["specialty"]
                    }
                },
                {
                    "name": "get_crisis_resources",
                    "description": "Fetch details of the General Listening Warmline.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {}
                    }
                }
            ]
        }
        send_response(req_id, result)

    elif method == "tools/call":
        params = request.get("params", {})
        tool_name = params.get("name")
        arguments = params.get("arguments", {})

        data = load_resources_data()

        if tool_name == "lookup_buddy_specialties":
            specialty_query = arguments.get("specialty", "").lower().strip()
            buddies = data.get("accredited_buddies", [])
            matched = []
            for b in buddies:
                specs = [s.lower() for s in b.get("specialties", [])]
                if specialty_query in specs:
                    matched.append({
                        "id": b.get("id"),
                        "name": b.get("name"),
                        "specialties": b.get("specialties"),
                        "availability": b.get("availability"),
                        "reply_time": b.get("reply_time")
                    })

            response_text = f"Found {len(matched)} buddies specializing in '{specialty_query}':\n" + json.dumps(matched, indent=2)
            result = {
                "content": [
                    {
                        "type": "text",
                        "text": response_text
                    }
                ]
            }
            send_response(req_id, result)

        elif tool_name == "get_crisis_resources":
            warmline = data.get("general_crisis_line", {})
            response_text = "Crisis Support & General Warmline Referral Information:\n" + json.dumps(warmline, indent=2)
            result = {
                "content": [
                    {
                        "type": "text",
                        "text": response_text
                    }
                ]
            }
            send_response(req_id, result)

        else:
            send_response(req_id, error={"code": -32601, "message": f"Tool not found: {tool_name}"})

    else:
        if req_id is not None:
            send_response(req_id, error={"code": -32601, "message": f"Method not found: {method}"})

def main():
    try:
        for line in sys.stdin:
            if not line.strip():
                continue
            handle_message(line)
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
