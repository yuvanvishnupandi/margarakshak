# Marga Rakshak - Smart Traffic Enforcement System

**Live Production Deployment:** [https://margarakshak-xi.vercel.app](https://margarakshak-xi.vercel.app)  
**Demo Video:** [Watch on DropBox](https://www.dropbox.com/scl/fi/olhgipdy6tnqgd7rynyvz/Screen-Recording-2026-05-07-095126.mp4?rlkey=us8acshyuceu60xhs9i9mjt5c&st=tacksy62&dl=0)

## What is Marga Rakshak?

Marga Rakshak is a comprehensive full-stack traffic violation management platform designed to connect citizens directly with traffic enforcement authorities. The goal is to make reporting violations easy and to streamline how police issue and manage challans.

**For Citizens:**  
You can register your vehicles, report traffic violations you see on the road (and attach photo/video evidence), view and pay your challans online, and track your trust score. You even earn rewards for accurately reporting violations!

**For Police Officers:**  
Officers get a dedicated dashboard to review reports submitted by citizens. You can approve or reject evidence, generate official challans, review citizen appeals, search vehicle databases, and view analytics on traffic trends.

## Features

- **Role-Based Access:** Separate, secure logins and dashboards for Citizens and Police.
- **Violation Reporting:** Upload photos/videos of traffic offenses directly from the app.
- **Challan Management:** Police can issue challans; citizens can view and pay them securely online.
- **Trust & Rewards System:** Good reporters get higher trust scores and earn reward points, while fake reports lower the score.
- **Appeals:** Citizens can dispute challans they believe were issued in error.
- **Live Notifications:** Get alerts when your report is verified or when you receive a challan.
- **Analytics & Leaderboard:** See who the top reporters are and view traffic violation heatmaps.

## System Architecture

The project is split into a modern React frontend and a fast Node.js backend.

### Frontend
- **Framework:** React 18 built with Vite
- **Routing:** React Router
- **Styling:** Tailwind CSS + custom Vanilla CSS for a highly polished, responsive UI
- **Maps & Charts:** React Leaflet for mapping violations and Recharts for analytics dashboards
- **Deployment:** Vercel

### Backend
- **Framework:** Node.js with Express
- **Database:** TiDB (Serverless MySQL)
- **Authentication:** JWT (JSON Web Tokens)
- **File Uploads:** Local storage for evidence files
- **Deployment:** Render

### Database Design
The SQL database is fully normalized and uses triggers to automatically calculate trust scores, update challan statuses, and manage user reward wallets without needing extra backend logic.

## How to Run Locally

If you want to spin this project up on your own machine, just follow these steps:

1. **Clone the repo**
   ```bash
   git clone https://github.com/yuvanvishnupandi/Traffic-Violation-Management-System.git
   cd Traffic-Violation-Management-System
   ```

2. **Install dependencies**
   We use `concurrently` to run both the frontend and backend at the same time.
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   cd ..
   ```

3. **Set up your environment variables**
   Create a `.env` file in the `backend/` directory with your database credentials (MySQL) and a `JWT_SECRET`.  
   Create a `.env` file in the `frontend/` directory with `VITE_API_URL=http://localhost:5000`.

4. **Start the servers**
   ```bash
   npm run dev
   ```
   This will start the backend on port 5000 and the Vite frontend on port 5173.
