"""
Traffic Violation Management System — Authentication Routes
Self-contained registration and login (No external middleware needed)
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import mysql.connector
import bcrypt
import logging
from datetime import datetime, timedelta
import jwt

router = APIRouter()
logger = logging.getLogger("tvms.auth")

# --- DATABASE CONFIGURATION ---
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'yvpandi@11',
    'database': 'traffic_violation_db'
}

# --- DATA MODELS ---
class CitizenRegister(BaseModel):
    full_name: str
    email: str
    phone_no: str
    password: str
    confirm_password: Optional[str] = None

class PoliceRegister(BaseModel):
    full_name: str
    email: str
    phone_no: str
    password: str
    confirm_password: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

# --- INTERNAL HELPER FUNCTIONS (Replaces middleware) ---
def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)

def create_token(data: dict):
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, "tvms-super-secret-key-2025", algorithm="HS256")


# ==========================================
# CITIZEN ROUTES
# ==========================================

@router.post("/citizen/register")
async def citizen_register(data: CitizenRegister):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT citizen_id FROM CITIZENS WHERE email = %s", (data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="Email is already registered")
            
        hashed_pw = hash_password(data.password)
        
        cursor.execute(
            """INSERT INTO CITIZENS (full_name, email, phone_no, password_hash, trust_score, account_status)
               VALUES (%s, %s, %s, %s, 50, 'Active')""",
            (data.full_name, data.email, data.phone_no, hashed_pw)
        )
        conn.commit() 
        return {"message": "Account created successfully", "citizen_id": cursor.lastrowid}
        
    except mysql.connector.Error as e:
        logger.error(f"DB Error: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals() and conn.is_connected(): conn.close()


@router.post("/citizen/login")
async def citizen_login(data: LoginRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM CITIZENS WHERE email = %s", (data.email,))
        user = cursor.fetchone()
        
        if not user or not verify_password(data.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        token = create_token({"sub": str(user["citizen_id"]), "role": "citizen"})
            
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user['citizen_id'],
                "full_name": user['full_name'],
                "email": user['email'],
                "role": "citizen"
            }
        }
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals() and conn.is_connected(): conn.close()

# ==========================================
# POLICE ROUTES
# ==========================================

@router.post("/police/register")
async def police_register(data: PoliceRegister):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT badge_no FROM POLICE_OFFICERS WHERE email = %s", (data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="Email is already registered")
            
        hashed_pw = hash_password(data.password)
        
        cursor.execute("SELECT COUNT(*) as count FROM POLICE_OFFICERS")
        count = cursor.fetchone()['count']
        badge_no = f"POL{count + 1:04d}"
        
        cursor.execute(
            """INSERT INTO POLICE_OFFICERS (badge_no, full_name, email, phone_no, password_hash, officer_rank, is_active)
               VALUES (%s, %s, %s, %s, %s, 'Officer', TRUE)""",
            (badge_no, data.full_name, data.email, data.phone_no, hashed_pw)
        )
        conn.commit() 
        return {"message": "Officer registered successfully", "badge_no": badge_no}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals() and conn.is_connected(): conn.close()


@router.post("/police/login")
async def police_login(data: LoginRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM POLICE_OFFICERS WHERE email = %s", (data.email,))
        user = cursor.fetchone()
        
        if not user or not verify_password(data.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        token = create_token({"sub": str(user["badge_no"]), "role": "police"})
            
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user['badge_no'],
                "full_name": user['full_name'],
                "email": user['email'],
                "role": "police"
            }
        }
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals() and conn.is_connected(): conn.close()