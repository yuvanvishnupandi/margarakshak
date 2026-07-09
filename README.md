<div align="center">
  <img src="frontend/public/traffic_light_hd.png" alt="Marga Rakshak Logo" width="120" style="margin-bottom: 20px;"/>
  <h1>Marga Rakshak</h1>
  <p><strong>Government of Tamil Nadu – Smart Traffic Enforcement System</strong></p>
  <p>An intelligent, agentic AI-powered traffic violation management platform.</p>
</div>

---

**Live Production Deployment:** [https://margarakshak-xi.vercel.app](https://margarakshak-xi.vercel.app)  
**Demo Video:** [Watch on DropBox](https://www.dropbox.com/scl/fi/olhgipdy6tnqgd7rynyvz/Screen-Recording-2026-05-07-095126.mp4?rlkey=us8acshyuceu60xhs9i9mjt5c&st=tacksy62&dl=0)

## Overview

**Marga Rakshak** is a next-generation traffic enforcement platform designed to bridge the gap between citizens and traffic authorities. By crowdsourcing violation reports and processing them through an **Autonomous AI Agentic Workflow**, it drastically reduces the manual administrative burden on police departments while ensuring safer roads.

Citizens can seamlessly register vehicles, submit media evidence of offenses, track fines, and build a trustworthy profile with gamified rewards. Traffic Officers are equipped with a powerful administrative suite, predictive intelligence, and automated AI assistance to evaluate submissions, issue fines, and monitor city-wide traffic behavior.

## Core Capabilities & AI Agents

Marga Rakshak utilizes a robust **Multi-Agent System** to automate the entire lifecycle of a traffic violation report.

- 📸 **AI Vision Agent (Gemini 2.5 Flash):** Automatically scans uploaded evidence (images/videos) to extract license plate numbers, identify vehicle types, and detect specific violations (e.g., No Helmet, Over-speeding) with high accuracy.
- ⚖️ **AI Rule Engine:** Validates the detected violations against the official Indian Motor Vehicles Act, automatically calculating the exact penalty amount and relevant sections.
- 🗄️ **RTO Database Agent:** Cross-references extracted license plates with the live Regional Transport Office (RTO) database to ensure the vehicle is registered and retrieve the owner's details.
- 🚨 **Predictive Hotspot Dispatcher:** A proactive intelligence engine that analyzes verified reports and generates real-time predictive duty dispatch alerts for police officers, identifying crash hotspots *before* they happen.
- 💬 **AskRakshak (Conversational AI Assistant):** A contextual, floating AI assistant available across the platform. AskRakshak acts as a legal expert, helping citizens understand traffic laws, summarizing active challans, and assisting police officers with enforcement protocols.
- 💻 **Autonomous Agentic Console:** A realistic, dynamic Mac-style terminal integrated into the Police Dashboard that provides officers with live, transparent insights into the real-time reasoning and actions of the AI agents.

## System Architecture

Marga Rakshak is built on a modern, scalable microservices architecture.

### 1. Frontend (Client Layer)
- **Framework:** React.js + Vite
- **Styling:** Vanilla CSS + Tailwind CSS (for layout utility)
- **Features:** Responsive design, animated Mac-terminal console, real-time toast notifications, distinct Citizen and Police portals.

### 2. Backend (API Layer)
- **Primary Server:** Node.js + Express.js (Port 5000)
- **AI Microservice:** Python + FastAPI (Port 8000)
- **Authentication:** JWT (JSON Web Tokens) with Role-Based Access Control (RBAC).

### 3. Database Layer
- **Relational Database:** MySQL (PlanetScale / Local)
- **Schema:** Optimized relational tables for `Users`, `Citizens`, `Police_Officers`, `Vehicles`, `Reports`, `Challans`, `Rules`, and `Notifications`.

### 4. AI & Cloud Integrations
- **AI Models:** Google Gemini 2.5 Flash (Vision & Reasoning), Groq (Fast Inference API)
- **Routing:** Multi-Model Fallback Router ensuring 99.9% uptime by gracefully falling back between providers.

## Key Workflows

### For Citizens:
1. **Report a Violation:** Upload a photo/video of a traffic offense.
2. **AI Pre-Processing:** The AI Vision Agent instantly extracts the license plate and violation type.
3. **Earn Rewards:** Once verified by police, earn Trust Points which can be redeemed for rewards.
4. **Manage Vehicles & Challans:** Register personal vehicles, view active challans, and read AI-generated summaries via AskRakshak.

### For Police Officers:
1. **Command Dashboard:** View predictive hotspots, total processed reports, and live AI agent logs.
2. **One-Click Verification:** Review AI-processed reports. The AI has already identified the plate, rule, and fine amount. Officers simply click "Verify & Issue Challan".
3. **Dispatch Management:** Acknowledge AI-recommended patrol dispatches for predicted high-risk zones.

## Local Setup Instructions

**Prerequisites:** Node.js (v18+), Python (3.9+), and MySQL.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yuvanvishnupandi/Traffic-Violation-Management-System.git
   cd Traffic-Violation-Management-System
   ```

2. **Database Setup:**
   - Create a MySQL database named `traffic_violation_db`.
   - Run the SQL schema provided in `backend/database_schema.sql`.

3. **Environment Variables:**
   - Create a `.env` file in the `backend/` directory with your MySQL credentials, JWT secret, and Google Gemini API Key.
   - Create a `.env` file in the `ai_service/` directory with your Groq API Key and Google Gemini API Key.

4. **Start the Application:**
   Windows users can simply run the provided batch script to start all services simultaneously:
   ```cmd
   start.bat
   ```
   *Alternatively, start services manually:*
   - Backend: `cd backend && npm install && npm start`
   - AI Service: `cd ai_service && pip install -r requirements.txt && uvicorn main:app --reload --port 8000`
   - Frontend: `cd frontend && npm install && npm run dev`

---
*Built with ❤️ for a safer tomorrow.*
