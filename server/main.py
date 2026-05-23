"""
Traffic Violation Management System — FastAPI Main Application
Full Production Version
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import logging

# Import all your routers
from routes import auth
# Import self-contained routers directly (these don't have external dependencies)
from routes import analytics as analytics_router
from routes import reports as reports_router
from routes import challans as challans_router
from routes import vehicles as vehicles_router
from routes import rules as rules_router
# If any of these files are missing or broken, the server will crash on startup!
try:
    from routes import police
    POLICE_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Police router not loaded: {e}")
    POLICE_AVAILABLE = False

try:
    from routes import trust
    TRUST_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Trust router not loaded: {e}")
    TRUST_AVAILABLE = False

try:
    from routes import rewards
    REWARDS_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Rewards router not loaded: {e}")
    REWARDS_AVAILABLE = False

try:
    from routes import appeals
    APPEALS_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Appeals router not loaded: {e}")
    APPEALS_AVAILABLE = False

try:
    from routes import notifications
    NOTIFICATIONS_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Notifications router not loaded: {e}")
    NOTIFICATIONS_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("tvms")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    logger.info("Starting Traffic Violation Management System...")
    
    # Safely create uploads directory structure without relying on external config files
    evidence_dir = os.path.join(os.getcwd(), "uploads", "evidence")
    os.makedirs(evidence_dir, exist_ok=True)
    logger.info(f"Uploads directory ready: {evidence_dir}")
    
    logger.info("System startup complete")
    yield
    logger.info("Shutting down Traffic Violation Management System...")

# Initialize FastAPI app
app = FastAPI(
    title="Traffic Violation Management System",
    description="Government/Law Enforcement Tier-1 DBMS Portal",
    version="1.0.0",
    lifespan=lifespan
)

# ==========================================
# CRITICAL FIX: CORS Middleware (Do not change this)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info("CORS middleware configured to allow all origins")

# Mount static files for evidence uploads
evidence_dir = os.path.join(os.getcwd(), "uploads")
os.makedirs(evidence_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=evidence_dir), name="uploads")

# ==========================================
# ROUTE INCLUSIONS
# ==========================================
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(analytics_router.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(reports_router.router, prefix="/api/reports", tags=["Reports"])
app.include_router(challans_router.router, prefix="/api/challans", tags=["Challans"])
app.include_router(vehicles_router.router, prefix="/api/vehicles", tags=["Vehicles"])
app.include_router(rules_router.router, prefix="/api/rules", tags=["Rules"])

if POLICE_AVAILABLE:
    app.include_router(police.router, prefix="/api/police", tags=["Police"])

if TRUST_AVAILABLE:
    app.include_router(trust.router, prefix="/api/trust", tags=["Trust & History"])

if REWARDS_AVAILABLE:
    app.include_router(rewards.router, prefix="/api/citizen/rewards", tags=["Rewards & Wallet"])

if APPEALS_AVAILABLE:
    app.include_router(appeals.router, prefix="/api/appeals", tags=["Appeals"])

if NOTIFICATIONS_AVAILABLE:
    app.include_router(notifications.router, prefix="/api/citizen/notifications", tags=["Notifications"])

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "OK",
        "service": "Traffic Violation Management System",
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Traffic Violation Management System API is Running",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True, log_level="info")