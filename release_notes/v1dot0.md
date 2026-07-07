# 🚀 MySupportBuddy v1.0 — Production Release Notes

Welcome to the **v1.0 Release** of **MySupportBuddy**, built for the Google & Kaggle AI Agents Capstone project. This release marks the transition from a prototype to a secure, production-grade, multi-agent wellness and clinical triage platform deployed on Google Cloud Run.

---

## 🌟 Key Architecture & Feature Highlights

### 1. 🤖 Multi-Agent Orchestration Pipeline
* **Orchestrator Agent (`agents/orchestrator.py`)**: Empathetically assesses user emotional distress, triages urgency, and routes queries.
* **Service Search Agent (`agents/search_agent.py`)**: Interface for querying the vetted buddies directory and crisis hotline database.
* **Privacy Guard**: Securely processes warmline session timers, logging only anonymized metadata to Firestore while immediately discarding call transcripts to enforce **Do No Harm** standards.

### 2. 🔌 Model Context Protocol (MCP) Server (`mcp_server.py`)
* Fully compliant with the official MCP specification (`2024-11-05`).
* Exposes resource URIs (`buddies://directory`, `crisis://resources`) and search/triage tools (`lookup_buddy_specialties`, `get_crisis_resources`) over a dependency-free JSON-RPC standard input/output transport.

### 3. 🧠 Multimodal Vision-Language TBI Scan Analyzer
* Integrates a clinical diagnostic pipeline displaying 10 sequential widescreen scans (5 raw sectional views and 5 neural network diagnostic overlays) mapping regional brain impact, cognitive symptoms, and mood metrics.
* Clinicians can trigger simulated uploads using synthetic patient records.

### 4. 🤝 Real-Time AI Co-Pilot & Clinical Handoff Ecosystem
* **Buddy Workspace**: Support buddies can launch a live simulated patient session with real-time sentiment analysis and safety checks.
* **1-Click Suggestions**: Buddies can copy suggested empathetic phrasing or box-breathing exercises directly into response drafts.
* **Clinical Handoff**: Connects peer support to clinical oversight by allowing buddies to packages summaries into handoff reports that instantly populate the psychiatric triage queue.

### 5. 🔒 Security & RBAC Hardening
* **Stateless JWT Authorization**: Implements Bearer Token sessions embedding a `role` claim (`patient`, `buddy`, `clinician`, `caregiver`).
* **Cryptographic Passwords**: Hashes passwords using PBKDF2 SHA-256 with a unique salt and 100,000 iterations.
* **Secret Manager Integration**: Deploys securely with zero hardcoded API keys by mounting environment secrets through GCP Secret Manager.
* **Dynamic Consent Controls**: Dynamically gates caregiver and clinician visibility using patient-revocable consent flags.

### 6. 📂 Conversation History & 30-Day Trash Bin
* Complete Firestore CRUD lifecycle.
* Modelled after enterprise data retention policies, allowing users to soft-delete chats, restore them, or permanently purge them.

### 7. 📊 Testing & Evaluation Suite (`evaluate_agent.py`)
* Automated benchmarking harness evaluating 9 comprehensive test vectors.
* Achieves **100% baseline accuracy** across safety guardrail coverage, out-of-scope precision, and triage routing.

---

## 🚀 Setup & Deployment
Refer to the main [README.md](file:///vms_and_github/Github/kaggle-google-CAPSTONE-june-2026/README.md) for full execution steps:
* Run locally via **Python Virtual Environment** or **Docker Compose**.
* Run the evaluation benchmarks: `python evaluate_agent.py`.
* Deploy directly to Google Cloud Run: `gcloud run deploy`.

---
**Submission Track**: Agents for Good  
**Kaggle Capstone Codebase Reference**: [@genidma](https://github.com/genidma)
