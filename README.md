# kaggle-google-CAPSTONE-june-2026

## Overview
This project is a prototype or MVP (minimum viable product) designed to be an AI-powered directory that instantly matches individuals in crisis with verified, local support services. 

Developed for the Google & Kaggle AI Agents Capstone [link](https://www.kaggle.com/competitions/vibecoding-agents-capstone-project/overview/evaluation), this system leverages a Multi-Agent architecture to provide reliable, safe, and actionable resource guidance.

## Architecture
The system is built on an agentic framework featuring:
* **Orchestrator Agent**: Manages user intent and delegates tasks.
* **Service Search Agent**: Queries verified resource databases.
* **MCP Server**: Provides secure, standardized connections to external service directories.
* **Security Layer**: Implements strict guardrails to ensure safe and ethical assistance.

## Project Goal
To provide a secure, scalable, and responsive interface for crisis support, meeting all requirements for the Kaggle Agentic Capstone challenge while demonstrating high-fidelity technical implementation.

## Setup Instructions
1. **Clone the repository**:
   ```bash
   git clone [https://github.com/yourusername/kaggle-google-CAPSTONE-june-2026.git](https://github.com/yourusername/kaggle-google-CAPSTONE-june-2026.git)
   cd kaggle-google-CAPSTONE-june-2026


2. **Initialize git and protect sensitive files**:
   ```git init
   echo ".env" >> .gitignore
   echo "__pycache__/" >> .gitignore
   echo "*.pyc" >> .gitignore

3. **Add your required API keys/endpoints to .env**:
   ```bash
   touch .env
   echo "OPENAI_API_KEY=your_key_here" >> .env
   echo "MCP_SERVER_ENDPOINT=your_endpoint_here" >> .env

4. **Install the required project dependencies**:
   ```bash
   pip install -r requirements.txt


5. Run the application:
   ```bash
   python app.py

## License
This project is developed for educational purposes under the Kaggle AI Agents Capstone guidelines. All rights reserved by the author. @[genidma](https://github.com/genidma)