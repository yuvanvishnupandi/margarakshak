"""
Traffic Violation Management System — Authentication Routes
Self-contained authentication endpoints with no external dependencies
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import pymysql
import bcrypt
import jwt
from datetime import datetime, timedelta
from fastapi.concurrency import run_in_threadpool

router = APIRouter()

# Database configuration - Using PyMySQL for MySQL 8.0 compatibility
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'yvpandi@11',
    'database': 'traffic_violation_db',
    'port': 3306,
    'connect_timeout': 3,
    'read_timeout': 5,
    'write_timeout': 5,
    'cursorclass': pymysql.cursors.DictCursor
}

# JWT Configuration
JWT_SECRET = "tvms-super-secret-key-2025"
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24


# Request models
class CitizenRegister(BaseModel):
    full_name: str
    email: str
    phone_no: Optional[str] = None
    password: str
    confirm_password: Optional[str] = None
    plate_no: str  # Vehicle number (mandatory)
    vehicle_type: str  # Car, Motorcycle, etc.
    vehicle_model: Optional[str] = None  # Optional vehicle model


class CitizenLogin(BaseModel):
    email: str
    password: str


class PoliceRegister(BaseModel):
    full_name: str
    email: str
    phone_no: Optional[str] = None
    password: str
    confirm_password: Optional[str] = None


class PoliceLogin(BaseModel):
    email: str
    password: str


# Helper functions - all self-contained
def get_db_connection():
    """Get direct database connection using PyMySQL."""
    try:
        conn = pymysql.connect(**DB_CONFIG)
        return conn
    except pymysql.Error as err:
        raise Exception(f"Database connection failed: {str(err)}")
    except Exception as e:
        raise Exception(f"Connection error: {str(e)}")


def hash_password(password: str) -> str:
    """Hash password with bcrypt (runs in threadpool to prevent blocking)."""
    try:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password hashing failed: {str(e)}"
        )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash (runs in threadpool to prevent blocking)."""
    try:
        result = bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        return result
    except Exception as e:
        print(f"Password verification error: {str(e)}")
        return False


def create_access_token(data: dict) -> str:
    """Create JWT token."""
    try:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
        to_encode = data.copy()
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token creation failed: {str(e)}"
        )


@router.post("/citizen/register")
async def citizen_register(register_data: CitizenRegister):
    """Register a new citizen account."""
    conn = None
    cursor = None
    
    try:
        # Validate password match
        if register_data.confirm_password and register_data.password != register_data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match"
            )
        
        # Validate password length
        if len(register_data.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long"
            )
        
        # Hash password in threadpool to prevent blocking
        password_hash = await run_in_threadpool(hash_password, register_data.password)
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print(f"\n[REGISTER] New citizen registration: {register_data.email}")
        print(f"[DATABASE] Connected to: traffic_violation_db")
        
        # Check if email already exists
        cursor.execute(
            "SELECT citizen_id FROM CITIZENS WHERE email = %s",
            (register_data.email,)
        )
        existing = cursor.fetchone()
        
        if existing:
            print(f"[ERROR] Email already exists: {register_data.email}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        
        # Insert new citizen
        cursor.execute(
            """INSERT INTO CITIZENS (full_name, email, phone_no, password_hash, trust_score, reward_points, account_status)
               VALUES (%s, %s, %s, %s, 50, 0, 'Active')""",
            (
                register_data.full_name,
                register_data.email,
                register_data.phone_no,
                password_hash
            )
        )
        
        citizen_id = cursor.lastrowid
        
        # Insert vehicle record linked to citizen
        cursor.execute(
            """INSERT INTO VEHICLES (plate_no, vehicle_model, vehicle_type, owner_name, owner_type, citizen_id, registered_at)
               VALUES (%s, %s, %s, %s, 'Individual', %s, NOW())""",
            (
                register_data.plate_no.upper(),
                register_data.vehicle_model or 'Unknown',
                register_data.vehicle_type,
                register_data.full_name,
                citizen_id
            )
        )
        
        # CRITICAL: Commit the transaction - ENSURES DATA PERSISTENCE
        conn.commit()
        
        print(f"[SUCCESS] Citizen registered: {register_data.full_name} (ID: {citizen_id})")
        print(f"[SUCCESS] Vehicle registered: {register_data.plate_no.upper()} (Type: {register_data.vehicle_type})")
        print(f"[PERSISTENCE] Data committed to database - PERMANENT\n")
        
        return {
            "message": "Registration successful",
            "citizen_id": citizen_id,
            "full_name": register_data.full_name,
            "email": register_data.email,
            "role": "citizen"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
            print(f"[ERROR] Registration failed, rolled back: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        if cursor:
            cursor.close()
        if conn and conn.open:
            conn.close()


@router.post("/citizen/login")
async def citizen_login(login_data: CitizenLogin):
    """Login with email and password for citizens."""
    conn = None
    cursor = None
    
    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # DEBUG: Log the login attempt
        print(f"\n[LOGIN ATTEMPT] Citizen email: {login_data.email}")
        print(f"[DATABASE] Connected to: traffic_violation_db")
        
        # Fetch citizen from database
        cursor.execute(
            """SELECT citizen_id, full_name, email, password_hash, trust_score, account_status
               FROM CITIZENS WHERE email = %s""",
            (login_data.email,)
        )
        user = cursor.fetchone()
        
        if not user:
            print(f"[ERROR] User not found in CITIZENS table: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials - User not found"
            )
        
        print(f"[SUCCESS] User found: {user['full_name']} (ID: {user['citizen_id']})")
        print(f"[DEBUG] Stored hash (first 30 chars): {user['password_hash'][:30]}...")
        
        # Verify password in threadpool to prevent blocking
        is_valid = await run_in_threadpool(verify_password, login_data.password, user["password_hash"])
        if not is_valid:
            print(f"[ERROR] Password mismatch for user: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials - Password mismatch"
            )
        
        print(f"[SUCCESS] Password verified for: {user['full_name']}")
        
        # Check account status
        if user["account_status"] != "Active":
            print(f"[ERROR] Account is {user['account_status']}: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account is {user['account_status']}. Please contact support."
            )
        
        # Generate JWT token
        token = create_access_token(
            data={
                "sub": str(user["citizen_id"]),
                "role": "citizen",
                "email": user["email"],
                "name": user["full_name"]
            }
        )
        
        print(f"[SUCCESS] Login successful - Token generated for: {user['full_name']}\n")
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "message": "Login successful",
            "user": {
                "id": user["citizen_id"],
                "full_name": user["full_name"],
                "email": user["email"],
                "role": "citizen",
                "trust_score": user["trust_score"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[EXCEPTION] Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        if cursor:
            cursor.close()
        if conn and conn.open:
            conn.close()


@router.post("/police/register")
async def police_register(register_data: PoliceRegister):
    """Register a new police officer account."""
    conn = None
    cursor = None
    
    try:
        # Validate password match
        if register_data.confirm_password and register_data.password != register_data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match"
            )
        
        # Validate password length
        if len(register_data.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long"
            )
        
        # Hash password in threadpool to prevent blocking
        password_hash = await run_in_threadpool(hash_password, register_data.password)
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if email already exists in POLICE_OFFICERS table
        cursor.execute(
            "SELECT badge_no FROM POLICE_OFFICERS WHERE email = %s",
            (register_data.email,)
        )
        existing = cursor.fetchone()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        
        # Generate badge number (auto-increment style)
        cursor.execute("SELECT COUNT(*) as count FROM POLICE_OFFICERS")
        count_result = cursor.fetchone()
        badge_no = f"POL{count_result['count'] + 1:04d}"  # e.g., POL0001, POL0002
        
        # Insert new police officer
        cursor.execute(
            """INSERT INTO POLICE_OFFICERS (badge_no, full_name, email, phone_no, password_hash, officer_rank, station_code, is_active)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                badge_no,
                register_data.full_name,
                register_data.email,
                register_data.phone_no,
                password_hash,
                "Constable",  # Default rank
                "HQ001",      # Default station code
                True          # Active by default
            )
        )
        
        # CRITICAL: Commit the transaction
        conn.commit()
        
        return {
            "message": "Registration successful",
            "badge_no": badge_no,
            "full_name": register_data.full_name,
            "email": register_data.email,
            "role": "police"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        if cursor:
            cursor.close()
        if conn and conn.open:
            conn.close()


@router.post("/police/login")
async def police_login(login_data: PoliceLogin):
    """Login with email and password for police officers."""
    conn = None
    cursor = None
    
    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # DEBUG: Log the login attempt
        print(f"\n[LOGIN ATTEMPT] Police email: {login_data.email}")
        print(f"[DATABASE] Connected to: traffic_violation_db")
        
        # Fetch police officer from database
        cursor.execute(
            """SELECT badge_no, full_name, email, password_hash, officer_rank, station_code, is_active
               FROM POLICE_OFFICERS WHERE email = %s""",
            (login_data.email,)
        )
        officer = cursor.fetchone()
        
        if not officer:
            print(f"[ERROR] Officer not found in POLICE_OFFICERS table: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials - Officer not found"
            )
        
        print(f"[SUCCESS] Officer found: {officer['full_name']} (Badge: {officer['badge_no']})")
        print(f"[DEBUG] Stored hash (first 30 chars): {officer['password_hash'][:30]}...")
        
        # Verify password in threadpool to prevent blocking
        is_valid = await run_in_threadpool(verify_password, login_data.password, officer["password_hash"])
        if not is_valid:
            print(f"[ERROR] Password mismatch for officer: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials - Password mismatch"
            )
        
        print(f"[SUCCESS] Password verified for: {officer['full_name']}")
        
        # Check if officer is active
        if not officer["is_active"]:
            print(f"[ERROR] Officer account is deactivated: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Officer account is deactivated"
            )
        
        # Generate JWT token
        token = create_access_token(
            data={
                "sub": officer["badge_no"],
                "role": "police",
                "email": officer["email"],
                "name": officer["full_name"]
            }
        )
        
        print(f"[SUCCESS] Login successful - Token generated for: {officer['full_name']}\n")
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "message": "Login successful",
            "user": {
                "id": officer["badge_no"],
                "full_name": officer["full_name"],
                "email": officer["email"],
                "role": "police",
                "badge_number": officer["badge_no"],
                "station": officer["station_code"],
                "rank": officer["officer_rank"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[EXCEPTION] Police login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        if cursor:
            cursor.close()
        if conn and conn.open:
            conn.close()


@router.get("/profile")
async def get_profile(authorization: str = None):
    """Get current user's full profile from database using JWT token."""
    conn = None
    cursor = None
    
    try:
        # Extract token from Authorization header
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header missing or invalid"
            )
        
        token = authorization.split(" ")[1]
        
        # Decode JWT token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        
        if not user_id or not role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if role == "citizen":
            cursor.execute(
                """SELECT citizen_id as id, full_name as name, email, phone_no, 
                          trust_score, reward_points, account_status, created_at
                   FROM CITIZENS WHERE citizen_id = %s""",
                (user_id,)
            )
            profile = cursor.fetchone()
            
            # DEBUG: Log what we're returning
            print(f"\n=== GET PROFILE ENDPOINT ===")
            print(f"User ID from token: {user_id}")
            print(f"Role: {role}")
            print(f"Profile from DB: {profile}")
            print(f"Trust score: {profile.get('trust_score') if profile else 'N/A'}")
            print(f"============================\n")
            
            # Safety check: if user not found in database
            if not profile:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Citizen not found in database"
                )
            
            # Add role to the returned profile
            profile["role"] = "citizen"
            return profile
            
        elif role == "police":
            cursor.execute(
                """SELECT badge_no as id, full_name as name, email, phone_no,
                          officer_rank as rank, station_code as station, is_active, created_at
                   FROM POLICE_OFFICERS WHERE badge_no = %s""",
                (user_id,)
            )
            profile = cursor.fetchone()
            
            # Safety check: if officer not found in database
            if not profile:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Police officer not found in database"
                )
            
            # Add role to the returned profile
            profile["role"] = "police"
            return profile
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role in token"
            )
            
    except HTTPException:
        raise
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        if cursor:
            cursor.close()
        if conn and conn.open:
            conn.close()


@router.put("/profile")
async def update_profile(
    profile_update: dict,
    authorization: str = None
):
    """Update current user's profile information (phone, name, etc.)."""
    conn = None
    cursor = None
    
    try:
        # Extract token from Authorization header
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header missing or invalid"
            )
        
        token = authorization.split(" ")[1]
        
        # Decode JWT token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        
        if not user_id or not role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if role == "citizen":
            # Build dynamic update query based on provided fields
            update_fields = []
            update_values = []
            
            if "full_name" in profile_update and profile_update["full_name"]:
                update_fields.append("full_name = %s")
                update_values.append(profile_update["full_name"])
            
            if "phone_no" in profile_update:
                update_fields.append("phone_no = %s")
                update_values.append(profile_update["phone_no"])
            
            if "reward_points" in profile_update:
                update_fields.append("reward_points = %s")
                update_values.append(profile_update["reward_points"])
            
            if not update_fields:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No valid fields to update"
                )
            
            # Add citizen_id to values
            update_values.append(user_id)
            
            # Execute update
            query = f"UPDATE CITIZENS SET {', '.join(update_fields)} WHERE citizen_id = %s"
            cursor.execute(query, update_values)
            conn.commit()
            
            # Fetch updated profile
            cursor.execute(
                """SELECT citizen_id as id, full_name as name, email, phone_no, 
                          trust_score, reward_points, account_status
                   FROM CITIZENS WHERE citizen_id = %s""",
                (user_id,)
            )
            updated_profile = cursor.fetchone()
            updated_profile["role"] = "citizen"
            
            return {
                "message": "Profile updated successfully",
                "profile": updated_profile
            }
            
        elif role == "police":
            # Build dynamic update query for police
            update_fields = []
            update_values = []
            
            if "full_name" in profile_update and profile_update["full_name"]:
                update_fields.append("full_name = %s")
                update_values.append(profile_update["full_name"])
            
            if "phone_no" in profile_update:
                update_fields.append("phone_no = %s")
                update_values.append(profile_update["phone_no"])
            
            if not update_fields:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No valid fields to update"
                )
            
            # Add badge_no to values
            update_values.append(user_id)
            
            # Execute update
            query = f"UPDATE POLICE_OFFICERS SET {', '.join(update_fields)} WHERE badge_no = %s"
            cursor.execute(query, update_values)
            conn.commit()
            
            # Fetch updated profile
            cursor.execute(
                """SELECT badge_no as id, full_name as name, email, phone_no,
                          officer_rank as rank, station_code as station
                   FROM POLICE_OFFICERS WHERE badge_no = %s""",
                (user_id,)
            )
            updated_profile = cursor.fetchone()
            updated_profile["role"] = "police"
            
            return {
                "message": "Profile updated successfully",
                "profile": updated_profile
            }
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role in token"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        if cursor:
            cursor.close()
        if conn and conn.open:
            conn.close()
