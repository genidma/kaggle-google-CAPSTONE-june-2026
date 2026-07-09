# MySupportBuddy — Peer Support & Crisis Resource Platform

> **✅ Project Live on Google Cloud Run:** [https://mysupportbuddy-170198436835.us-central1.run.app](https://mysupportbuddy-170198436835.us-central1.run.app)

**MySupportBuddy** is imagined as an AI-powered peer support platform that connects individuals with **accredited, vetted peer support buddies** for warm, judgment-free conversations — and provides a direct link to a **General Support Warmline** when professional support is needed.

In particular, it is conceived as an idea for civilians and veterans who have had a traumatic brain injury (TBI). And MySupportBuddy is imagined to be a holistic support system for those who have had a TBI and their caregivers.So that the individuals and their caregivers have the absolute best support that they need. 

Developed for the **Google & Kaggle AI Agents Capstone**, MySupportBuddy demonstrates a responsible, privacy-first multi-agent architecture built around human wellbeing and veteran-friendly design principles.

![MySupportBuddy Architecture & Submission Flow](img/assets/main-readme01.png)

---

## 💡 What MySupportBuddy Does

1. **Talk to an Accredited Buddy**: Users can reach out to a certified, vetted peer support buddy at any time. Buddies are real people who have passed certification and vetting requirements before appearing on the platform.
2. **Interactive Demo Mode (Play Cards)**: Visitors can try instant one-click demonstration cards simulating real-world peer support scenarios (Veteran Transition, Peer Buddy Match, 24/7 Warmline Info, and Caregiver Support).
3. **Access the General Warmline**: For situations where the user feels overwhelmed or needs professional support, the General Support Warmline is always one tap away — confidential and available 24/7.
4. **Privacy-Protected Buddy Notifications & Persistent Logs**: When a user calls the warmline through the app:
   - ✅ The buddy is notified *that* their peer called, and *for how long* (persisted securely in Google Cloud Firestore).
   - ❌ The buddy is **never** told what was discussed — call content is discarded and never recorded.
   - This allows the buddy to proactively check in with care, maintaining strict **Do No Harm** access boundaries.
5. **Conversation History & Trash Bin**: Authenticated users can manage their chat sessions, view historical conversations, and utilize a soft-delete **30-Day Trash Bin** modeled after enterprise data retention standards.

---

## 🛡️ Role-Based Access Control (RBAC) & Responsibilities (#1, #4, #5)

MySupportBuddy enforces strict role-based access boundaries to protect human wellbeing, maintain confidentiality, and uphold **Do No Harm** ethical principles:

| Role | Access Level & Key Responsibilities | Ethics & Governance |
|---|---|---|
| **👤 Patient** | Standard user portal. Can interact with AI peer support, browse the accredited buddy roster, call the 24/7 warmline, and manage chat history/trash bin. | Complete control over personal data and caregiver consent toggles. |
| **🛡️ Support Buddy** | Dedicated **Buddy Care Dashboard**. Accesses assigned peer support queue, views warmline call metadata (duration only), and logs non-clinical supportive notes. | Operates under accredited peer guidelines (#5). Absolutely no access to call transcripts or clinical records. |
| **🩺 Clinician** | Secure **Clinician Triage Portal**. Reviews high-priority escalated triage cases, symptom reports, and diagnostic risk levels. | Bound by HIPAA confidentiality and clinical authorization. Roadmap includes TBI neuro-imaging scan analysis (#2). |
| **🌟 Caregiver** | **Caregiver Wellness Portal**. Monitors high-level mood summaries and check-in statuses for family members. | Strict consent policy: access is dynamically gated by patient consent settings. |

### 🧪 Sandbox Demo Accounts (For Evaluators & Testing)

> [!NOTE]  
> **🔒 Sandbox Security & Privacy Notice**  
> To assist judges and evaluators in reviewing role-specific dashboards without friction, the application automatically seeds synthetic demo accounts on startup. **To protect evaluator testing sessions, password modification is programmatically disabled for all pre-seeded `@test.com` accounts.** Do not enter real personal or medical information into demo accounts.

| Role Portal | Demo Email | Demo Password | Key Features to Explore |
|---|---|---|---|
| **👤 Patient** | `patient@test.com` | `password123` | AI Peer Support chat, interactive demo cards, Support Buddies roster, 24/7 Warmline timer, 30-day trash bin |
| **🛡️ Support Buddy** | `buddy@test.com` | `password123` | **Buddy Care Dashboard**, assigned peer queue, supportive note logging, call logs without transcripts (**Do No Harm**) |
| **🩺 Clinician** | `clinician@test.com` | `password123` | **Clinician Triage Portal**, high-risk escalated triage cases, TBI Neuro-Imaging scan analysis roadmap (#2) |
| **🌟 Caregiver** | `caregiver@test.com` | `password123` | **Caregiver Wellness Portal**, consented patient check-in status summaries |

---

## 🤖 Multi-Agent Architecture

```mermaid
graph TD
    User(["User Message"]) --> Orchestrator["Orchestrator Agent"]

    Orchestrator -->|Classify need| Analysis{"Support Type"}
    Analysis -->|General support| Buddy["Connect to Accredited Buddy"]
    Analysis -->|Feeling distressed| Both["Buddy + Warmline Recommended"]

    Buddy --> Search["Service Search Agent"]
    Both  --> Search

    Search --> BuddyDB[("Buddy Directory")]
    Search --> CrisisDB[("Warmline Info")]

    Buddy  --> Response["Synthesized Response & Buddy Cards"]
    Both   --> Response

    User -->|Calls Warmline| CallTimer["In-App Call Timer"]
    CallTimer -->|End Call| PrivacyGuard["Privacy Guard Agent"]
    PrivacyGuard -->|Metadata Only| BuddyNotif["Firestore Call Logs"]
    PrivacyGuard -->|No Transcript| NullStore["Content Discarded"]
```

### Agent Roles

| Agent | Role |
|---|---|
| **Orchestrator Agent** (`agents/orchestrator.py`) | Classifies the user's emotional support needs (general/distressed), synthesizes warm responses, and routes to the appropriate resource. |
| **Service Search Agent** (`agents/search_agent.py`) | Queries the buddy directory and warmline database, returning available buddies and crisis line info. |
| **Privacy Guard** (`app.py /api/crisis-call-log`) | Logs only call metadata (timestamp + duration) to Firestore for buddy awareness. The call content is discarded and never stored or shared. |

---

## 🗂️ Project Structure

```
.
├── agents/
│   ├── orchestrator.py     # Triage, classification, response synthesis
│   └── search_agent.py     # Buddy directory & crisis line querying
├── data/
│   └── resources.json      # Accredited buddies + General Warmline data
├── static/
│   ├── index.html          # Main UI dashboard (with responsive Mobile Bottom Nav)
│   ├── index.css           # Light cream/forest-green veteran-friendly design system
│   └── index.js            # Stateful conversational UI, JWT auth, trash bin, and demo mode
├── app.py                  # FastAPI server with JWT auth, Firestore CRUD, and call logs
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Setup & Running Locally

### Option A: Python Environment

```bash
# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env and configure your GEMINI_API_KEY and JWT_SECRET

# 4. Run the automated evaluation & benchmarking harness
python evaluate_agent.py

# 5. Run the server
python app.py
```

Open **http://localhost:8080** in your browser.

### Option B: Docker

```bash
# 1. Build and run containers in the background
docker-compose up -d --build

# 2. Check container status
docker-compose ps

# 3. Stream live application logs
docker-compose logs -f

# 4. Stop and remove containers
docker-compose down
```

---

## ☁️ Deploying to Google Cloud Run

```bash
# Authenticate and set your project
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID

# Deploy from source
gcloud run deploy mysupportbuddy \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars="GEMINI_MODEL=gemini-2.5-flash" \
    --set-secrets="GEMINI_API_KEY=gemini-api-key:latest,JWT_SECRET=jwt-secret:latest"
```

---

## 🔒 Privacy Design & Database Principles

- **Cloud Firestore Native Integration**: User accounts and persistent warmline logs are securely stored in Google Cloud Firestore.
- **Stateless JWT Authentication**: Passwords are hashed using PBKDF2 SHA-256 with stateless bearer token authentication.
- **Content is never stored**: Warmline call transcripts are discarded immediately. Only metadata (time, duration) is retained for buddy notifications.
- **Do No Harm access boundaries**: Designed with role-specific access controls (Patient, Buddy, Clinician, Caregiver) ensuring maximum privacy.
- **Pure Responsive CSS**: Responsive mobile bottom navigation and modals implemented without heavy external mobile frameworks.

---

## 🔌 Model Context Protocol (MCP) Server Integration (#20)

MySupportBuddy includes a native Model Context Protocol (MCP) server implementation (`mcp_server.py`) that conforms to the official protocol version `2024-11-05`. This allows external AI models or client agents to securely interface with our verified peer directories and support resources.

### MCP Shared Schema

* **Resources**:
  * `buddies://directory` — Shares the JSON database of accredited, vetted peer support buddies.
  * `crisis://resources` — Shares the 24/7 general listening warmline referral contact details.
* **Tools**:
  * `lookup_buddy_specialties(specialty)` — A tool allowing client agents to search peer buddies by specific specialty categories (e.g. `Anxiety`, `Crisis`).
  * `get_crisis_resources()` — Returns the active hotline referrals.

### Running the MCP Server
Since the server uses standard input/output (`stdin`/`stdout`) transport, it requires zero external python library installations and can be integrated into any MCP-capable client (like Claude Desktop or Cursor):

```json
{
  "mcpServers": {
    "mysupportbuddy-mcp": {
      "command": "python3",
      "args": ["/path/to/mysupportbuddy/mcp_server.py"]
    }
  }
}
```

---

## 📋 Evaluation Track

This project is submitted under the **Agents for Good** track of the Kaggle AI Agents Capstone [link](https://www.kaggle.com/competitions/5-day-ai-agents-intensive-vibecoding-course-with-google/discussion/709721).

## The 5 minute youtube demo 
The demo is available via the following [link](https://youtu.be/TfPGN4LbRIQ)

**License**: Developed for educational purposes under Kaggle AI Agents Capstone guidelines. All rights reserved by the author. [@genidma](https://github.com/genidma)