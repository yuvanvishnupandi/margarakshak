from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

class LocationData(BaseModel):
    lat: float = Field(..., description="Latitude coordinate", ge=-90, le=90)
    lng: float = Field(..., description="Longitude coordinate", ge=-180, le=180)
    
class EvidencePayload(BaseModel):
    user_id: str = Field(..., description="The ID of the citizen submitting evidence")
    image_url: str = Field(..., description="URL or Path to the uploaded image")
    exif_gps: Optional[LocationData] = Field(None, description="GPS extracted from EXIF metadata")
    device_gps: Optional[LocationData] = Field(None, description="GPS extracted from HTML5 GeoLocation at capture time")
    ip_address: str = Field(..., description="IP Address of the client submitting the form")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Time of submission")

class ValidationResult(BaseModel):
    is_valid_submission: bool = Field(..., description="True if valid submission")
    rejection_reason: Optional[str] = Field(None, description="Reason for rejection, if is_valid_submission is false")
    license_plate_found: bool = Field(..., description="True if exactly one plate is found")
    extracted_plate: Optional[str] = Field(None, description="Extracted license plate string")
    violation_detected: Optional[str] = Field(None, description="Identified traffic violation type")
    confidence_score: Optional[int] = Field(None, description="Confidence of the violation from 0 to 100")
    auto_approve: Optional[bool] = Field(None, description="True if confidence is 90 or higher")

class ChallanDetails(BaseModel):
    challan_id: str
    plate_number: str
    owner_name: str
    owner_phone: str
    violation_type: str
    fine_amount: float
    currency: str = "INR"
    jurisdiction_id: str
    status: str = "ISSUED"

class AgentState(BaseModel):
    payload: EvidencePayload
    is_fraud: bool = False
    fraud_reason: Optional[str] = None
    jurisdiction_id: Optional[str] = None
    vision_validation: Optional[ValidationResult] = None
    owner_details: Optional[dict] = None
    needs_manual_review: bool = False
    final_challan: Optional[ChallanDetails] = None
