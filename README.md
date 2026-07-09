# Marga Rakshak
Government of Tamil Nadu - Smart Traffic Enforcement System

An intelligent, agentic AI-powered traffic violation management platform.

## Live Deployments
- Production Deployment: https://margarakshak-xi.vercel.app
- Demo Video: [Watch on DropBox](https://www.dropbox.com/scl/fi/olhgipdy6tnqgd7rynyvz/Screen-Recording-2026-05-07-095126.mp4?rlkey=us8acshyuceu60xhs9i9mjt5c&st=tacksy62&dl=0)

## System Overview
Marga Rakshak is an end-to-end traffic enforcement platform designed to bridge the gap between citizens and traffic authorities. The system crowdsources violation reports and processes them through an autonomous AI workflow, reducing manual administrative burdens and ensuring safer roads.

Citizens can register vehicles, submit media evidence, track fines, and earn trust points. Traffic authorities have access to a dashboard equipped with predictive intelligence and automated AI tools to evaluate submissions, issue fines, and monitor traffic behavior.

## Core Architecture and Multi-Agent System
The platform operates on a robust multi-agent architecture to automate the processing lifecycle of traffic violations.

### AI Agents
1. Vision Agent (Gemini 2.5 Flash): Analyzes uploaded evidence to extract license plate numbers, identify vehicle models, and detect specific violations.
2. Rule Engine: Validates detected violations against the Motor Vehicles Act, calculating accurate penalty amounts and identifying relevant legal sections.
3. RTO Database Agent: Cross-references license plates with live RTO records to verify vehicle registration and retrieve ownership details.
4. Predictive Hotspot Dispatcher: Analyzes historical and real-time data to predict high-risk crash zones and generates duty dispatch alerts for officers.
5. AskRakshak (Conversational AI): A contextual AI assistant that helps citizens understand traffic laws and assists officers with enforcement protocols.

### Technical Stack
- Frontend: React.js, Vite, Vanilla CSS, Tailwind CSS
- Backend API: Node.js, Express.js
- AI Microservice: Python, FastAPI
- Database: MySQL
- Authentication: JWT with Role-Based Access Control
- AI Integrations: Google Gemini 2.5 Flash, Groq

## Setup and Installation

Prerequisites: Node.js (v18+), Python (3.9+), MySQL.

1. Clone the repository:
   git clone https://github.com/yuvanvishnupandi/Traffic-Violation-Management-System.git
   cd Traffic-Violation-Management-System

2. Database Setup:
   - Create a MySQL database named `traffic_violation_db`.
   - Execute the SQL schema found in `backend/database_schema.sql`.

3. Environment Variables:
   - Create a `.env` file in the `backend/` directory with your MySQL credentials, JWT secret, and Google Gemini API Key.
   - Create a `.env` file in the `ai_service/` directory with your Groq API Key and Google Gemini API Key.

4. Start the Application:
   Windows users can run the startup script:
   start.bat

   Alternatively, start each service manually:
   - Backend: `cd backend && npm install && npm start`
   - AI Service: `cd ai_service && pip install -r requirements.txt && uvicorn main:app --reload --port 8000`
   - Frontend: `cd frontend && npm install && npm run dev`
