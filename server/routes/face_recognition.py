"""
Traffic Violation Management System — Face Recognition Routes
Endpoints for face detection, registration, and verification
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import numpy as np
import logging
from typing import Optional

from services.face_service import face_service
from database import get_cursor
from middleware.auth import create_access_token, serialize_encoding, deserialize_encoding

router = APIRouter()
logger = logging.getLogger("tvms.face_routes")


class FaceRegistrationRequest(BaseModel):
    citizen_id: int
    image_base64: str


class FaceLoginRequest(BaseModel):
    image_base64: str


@router.post("/register_face")
async def register_face(citizen_id: int = Form(...), image: UploadFile = File(...)):
    """
    Register face encoding for a citizen.
    Receives an image, detects face, extracts encoding, stores in database.
    """
    try:
        # Load face detection models
        face_service.load_models()
        
        if not face_service.model_loaded:
            raise HTTPException(
                status_code=500,
                detail="Face detection model not loaded. Please download OpenCV DNN models."
            )
        
        # Read uploaded image
        image_bytes = await image.read()
        import cv2
        import numpy as np
        
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        cv_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if cv_image is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Detect face
        bbox = face_service.detect_face(cv_image)
        
        if bbox is None:
            raise HTTPException(
                status_code=400,
                detail="No face detected in the image. Please ensure your face is clearly visible."
            )
        
        # Extract encoding
        encoding = face_service.extract_encoding(cv_image, bbox)
        
        if encoding is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to extract face encoding. Please try again."
            )
        
        # Serialize encoding to bytes
        encoding_bytes = encoding.tobytes()
        
        # Store in database
        with get_cursor() as (cursor, conn):
            # Check if citizen exists
            cursor.execute(
                "SELECT citizen_id, full_name FROM CITIZENS WHERE citizen_id = %s",
                (citizen_id,)
            )
            citizen = cursor.fetchone()
            
            if not citizen:
                conn.rollback()
                raise HTTPException(status_code=404, detail="Citizen not found")
            
            # Update face encoding
            cursor.execute(
                "UPDATE CITIZENS SET face_encoding = %s WHERE citizen_id = %s",
                (encoding_bytes, citizen_id)
            )
            conn.commit()
        
        return {
            "message": "Face registered successfully",
            "citizen_id": citizen_id,
            "citizen_name": citizen["full_name"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Face registration error: {e}")
        raise HTTPException(status_code=500, detail=f"Face registration failed: {str(e)}")


@router.post("/login_face")
async def login_face(image: UploadFile = File(...)):
    """
    Face-based login.
    Receives an image, detects face, compares against all stored encodings.
    Returns JWT token if match found.
    """
    try:
        # Load face detection models
        face_service.load_models()
        
        if not face_service.model_loaded:
            raise HTTPException(
                status_code=500,
                detail="Face detection model not loaded"
            )
        
        # Read uploaded image
        image_bytes = await image.read()
        import cv2
        import numpy as np
        
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        cv_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if cv_image is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Detect face
        bbox = face_service.detect_face(cv_image)
        
        if bbox is None:
            raise HTTPException(
                status_code=400,
                detail="No face detected in the image"
            )
        
        # Extract encoding from live image
        live_encoding = face_service.extract_encoding(cv_image, bbox)
        
        if live_encoding is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to extract face encoding"
            )
        
        # Fetch all citizens with face encodings
        with get_cursor() as (cursor, conn):
            cursor.execute(
                "SELECT citizen_id, full_name, email, face_encoding, trust_score, account_status FROM CITIZENS WHERE face_encoding IS NOT NULL AND account_status = 'Active'"
            )
            citizens = cursor.fetchall()
        
        if not citizens:
            raise HTTPException(
                status_code=404,
                detail="No registered faces found in database"
            )
        
        # Compare with all stored encodings
        best_match = None
        best_distance = float('inf')
        tolerance = 0.5  # Adjust based on your needs
        
        for citizen in citizens:
            if citizen["face_encoding"] is None:
                continue
            
            try:
                # Deserialize stored encoding
                stored_encoding = np.frombuffer(citizen["face_encoding"], dtype=np.float32)
                
                if len(stored_encoding) != 128:
                    continue
                
                # Calculate distance
                distance = face_service.compare_encodings(live_encoding, stored_encoding)
                
                if distance < best_distance:
                    best_distance = distance
                    best_match = citizen
                
            except Exception as e:
                logger.error(f"Error comparing encodings for citizen {citizen['citizen_id']}: {e}")
                continue
        
        # Check if match is within tolerance
        if best_match is None or best_distance > tolerance:
            raise HTTPException(
                status_code=401,
                detail="Face not recognized. Please try again or use email/password login."
            )
        
        # Generate JWT token
        token = create_access_token(
            data={
                "sub": str(best_match["citizen_id"]),
                "role": "citizen",
                "email": best_match["email"],
                "name": best_match["full_name"]
            }
        )
        
        return {
            "message": "Face login successful",
            "token": token,
            "user": {
                "id": best_match["citizen_id"],
                "name": best_match["full_name"],
                "email": best_match["email"],
                "role": "citizen",
                "trust_score": best_match["trust_score"]
            },
            "confidence": best_distance
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Face login error: {e}")
        raise HTTPException(status_code=500, detail=f"Face login failed: {str(e)}")


@router.post("/detect_face")
async def detect_face_endpoint(image: UploadFile = File(...)):
    """
    Simple face detection endpoint (for testing).
    Returns whether a face was detected and bounding box coordinates.
    """
    try:
        face_service.load_models()
        
        if not face_service.model_loaded:
            raise HTTPException(status_code=500, detail="Face detection model not loaded")
        
        # Read image
        image_bytes = await image.read()
        import cv2
        import numpy as np
        
        nparr = np.frombuffer(image_bytes, np.uint8)
        cv_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if cv_image is None:
            raise HTTPException(status_code=400, detail="Invalid image")
        
        # Detect face
        bbox = face_service.detect_face(cv_image)
        
        if bbox is None:
            return {
                "face_detected": False,
                "message": "No face detected"
            }
        
        return {
            "face_detected": True,
            "bounding_box": {
                "x": bbox[0],
                "y": bbox[1],
                "width": bbox[2],
                "height": bbox[3]
            },
            "message": "Face detected successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Face detection error: {e}")
        raise HTTPException(status_code=500, detail=f"Face detection failed: {str(e)}")
