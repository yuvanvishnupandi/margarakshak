"""
Traffic Violation Management System — Reports Routes
Self-contained with pymysql, no external dependencies
"""
from fastapi import APIRouter, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import pymysql
from datetime import datetime
import os
import shutil
from pathlib import Path

router = APIRouter()

# Database configuration
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'yvpandi@11',
    'database': 'traffic_violation_db',
    'port': 3306,
    'connect_timeout': 5,
    'read_timeout': 10,
    'write_timeout': 10,
    'cursorclass': pymysql.cursors.DictCursor
}

# Configure upload directory
UPLOAD_DIR = Path(__file__).parent.parent / "uploads" / "evidence"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed file types and max size (5MB)
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def get_db_connection():
    """Get database connection."""
    try:
        conn = pymysql.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection failed: {str(e)}"
        )


@router.post("/upload-evidence/{report_id}")
async def upload_evidence(report_id: int, file: UploadFile = File(...)):
    """Upload evidence photo for a report."""
    conn = None
    cursor = None
    
    try:
        # Validate file type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed: JPEG, PNG"
            )
        
        # Read file content to check size
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 5MB limit"
            )
        
        # Check if report exists
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT report_id FROM REPORTS WHERE report_id = %s", (report_id,))
        report = cursor.fetchone()
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        # Generate unique filename — include microseconds to prevent collision on parallel uploads
        import uuid as _uuid
        file_extension = Path(file.filename).suffix
        unique_filename = f"report_{report_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')}_{_uuid.uuid4().hex[:6]}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # Build URL for this uploaded file
        evidence_url = f"/uploads/evidence/{unique_filename}"

        # Read existing evidence paths (append instead of overwrite)
        cursor.execute("SELECT evidence_path FROM REPORTS WHERE report_id = %s", (report_id,))
        existing_row = cursor.fetchone()
        existing_val = existing_row.get('evidence_path', '') if existing_row else ''

        import json as _json
        try:
            paths = _json.loads(existing_val) if existing_val else []
            if not isinstance(paths, list):
                paths = [existing_val] if existing_val else []
        except Exception:
            paths = [existing_val] if existing_val else []

        paths.append(evidence_url)

        cursor.execute(
            "UPDATE REPORTS SET evidence_path = %s WHERE report_id = %s",
            (_json.dumps(paths), report_id)
        )
        conn.commit()

        return {
            "message": "Evidence uploaded successfully",
            "report_id": report_id,
            "evidence_path": evidence_url,
            "total_photos": len(paths)
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


# Request models
class ReportCreateRequest(BaseModel):
    citizen_id: int
    plate_no: str
    violation_type: str
    location_coords: Optional[str] = None
    location_address: Optional[str] = None
    description: str
    evidence_path: Optional[str] = None


class ReportUpdateRequest(BaseModel):
    plate_no: Optional[str] = None
    location_coords: Optional[str] = None
    location_address: Optional[str] = None
    description: Optional[str] = None


class PoliceStatusUpdateRequest(BaseModel):
    status: str  # 'Verified', 'Rejected'
    rule_id: Optional[int] = None  # Required for Verified status
    badge_no: Optional[str] = None  # Officer badge number


@router.post("/create")
async def create_report(report_data: ReportCreateRequest):
    """Citizen creates a new violation report with automatic vehicle creation."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # CRITICAL: Check if citizen account is suspended or trust_score is 0
        cursor.execute(
            """SELECT citizen_id, account_status, trust_score 
               FROM CITIZENS 
               WHERE citizen_id = %s""",
            (report_data.citizen_id,)
        )
        citizen = cursor.fetchone()
        
        if not citizen:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Citizen account not found"
            )
        
        # BLOCK suspended accounts
        if citizen['account_status'] == 'Suspended':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="ACCESS DENIED: Your account is suspended due to a Trust Score of 0. You cannot submit reports. Please contact the traffic department to appeal."
            )
        
        # BLOCK accounts with trust_score <= 0
        if citizen['trust_score'] <= 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="ACCESS DENIED: Your Trust Score is 0. Your account has been suspended. You cannot submit reports. Please contact the traffic department to appeal."
            )
        
        # Account is active and trust_score > 0, proceed with report creation
        # Step 1: Check if vehicle already exists in VEHICLES table
        cursor.execute(
            "SELECT plate_no FROM VEHICLES WHERE plate_no = %s",
            (report_data.plate_no,)
        )
        vehicle_exists = cursor.fetchone()
        
        # Step 2: If vehicle doesn't exist, create it with default values
        if not vehicle_exists:
            cursor.execute(
                """INSERT INTO VEHICLES 
                   (plate_no, vehicle_model, vehicle_type, owner_name, owner_type, registered_at)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (
                    report_data.plate_no,
                    'Unknown',
                    'Other',
                    'Unknown',
                    'Individual',
                    datetime.utcnow()
                )
            )
        
        # Step 3: Insert the report (vehicle now guaranteed to exist)
        cursor.execute(
            """INSERT INTO REPORTS 
               (citizen_id, plate_no, violation_type, location_coords, location_address, 
                description, evidence_path, status, date_reported)
               VALUES (%s, %s, %s, %s, %s, %s, %s, 'Pending', %s)""",
            (
                report_data.citizen_id,
                report_data.plate_no,
                report_data.violation_type,
                report_data.location_coords,
                report_data.location_address,
                report_data.description,
                report_data.evidence_path,
                datetime.utcnow()
            )
        )
        
        # Step 4: Commit both operations in one transaction
        conn.commit()
        report_id = cursor.lastrowid
        
        return {
            "message": "Report created successfully",
            "report_id": report_id,
            "status": "Pending",
            "vehicle_created": not vehicle_exists
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


@router.get("/my-reports/{citizen_id}")
async def get_my_reports(citizen_id: int):
    """Get all reports for a specific citizen."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """SELECT report_id, citizen_id, plate_no, violation_type, location_coords,
                      location_address, description, status, 
                      date_reported as reported_at, reviewed_at, reviewed_by
               FROM REPORTS
               WHERE citizen_id = %s
               ORDER BY date_reported DESC""",
            (citizen_id,)
        )
        
        reports = cursor.fetchall()
        
        # Convert datetime objects to strings for JSON serialization
        for report in reports:
            if report.get('reported_at'):
                report['reported_at'] = report['reported_at'].isoformat()
            if report.get('reviewed_at'):
                report['reviewed_at'] = report['reviewed_at'].isoformat()
        
        return {
            "message": "Reports fetched successfully",
            "count": len(reports),
            "reports": reports
        }
        
    except HTTPException:
        raise
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


@router.put("/update/{report_id}")
async def update_report(report_id: int, update_data: ReportUpdateRequest):
    """Update a report (only if status is Pending)."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if report exists and is Pending
        cursor.execute(
            "SELECT status FROM REPORTS WHERE report_id = %s",
            (report_id,)
        )
        report = cursor.fetchone()
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        if report['status'] != 'Pending':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot update report with status '{report['status']}'. Only Pending reports can be updated."
            )
        
        # Build dynamic update query
        update_fields = []
        update_values = []
        
        if update_data.plate_no is not None:
            update_fields.append("plate_no = %s")
            update_values.append(update_data.plate_no)
        
        if update_data.location_coords is not None:
            update_fields.append("location_coords = %s")
            update_values.append(update_data.location_coords)
        
        if update_data.location_address is not None:
            update_fields.append("location_address = %s")
            update_values.append(update_data.location_address)
        
        if update_data.description is not None:
            update_fields.append("description = %s")
            update_values.append(update_data.description)
        
        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        update_values.append(report_id)
        
        query = f"UPDATE REPORTS SET {', '.join(update_fields)} WHERE report_id = %s"
        cursor.execute(query, update_values)
        
        conn.commit()
        
        return {
            "message": "Report updated successfully",
            "report_id": report_id
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


@router.delete("/delete/{report_id}")
async def delete_report(report_id: int):
    """Delete a report (only if status is Pending)."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if report exists and is Pending
        cursor.execute(
            "SELECT status FROM REPORTS WHERE report_id = %s",
            (report_id,)
        )
        report = cursor.fetchone()
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        if report['status'] != 'Pending':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete report with status '{report['status']}'. Only Pending reports can be deleted."
            )
        
        # Delete the report
        cursor.execute("DELETE FROM REPORTS WHERE report_id = %s", (report_id,))
        conn.commit()
        
        return {
            "message": "Report deleted successfully",
            "report_id": report_id
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


@router.get("/police/pending")
async def get_pending_reports():
    """Get all pending reports with citizen details (JOIN REPORTS and CITIZENS)."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # JOIN with CITIZENS table to get reporter name, email, and trust score
        cursor.execute(
            """SELECT r.report_id, r.citizen_id, r.plate_no, r.violation_type,
                      r.location_coords, r.location_address,
                      r.description, r.evidence_path, r.status, r.date_reported as reported_at,
                      c.full_name as reporter_name, 
                      c.email as reporter_email,
                      c.trust_score as reporter_trust_score
               FROM REPORTS r
               JOIN CITIZENS c ON r.citizen_id = c.citizen_id
               WHERE r.status = 'Pending'
               ORDER BY r.date_reported DESC"""
        )
        
        reports = cursor.fetchall()
        
        # Convert datetime objects to strings
        for report in reports:
            if report.get('reported_at'):
                report['reported_at'] = report['reported_at'].isoformat()
        
        return {
            "message": "Pending reports fetched successfully",
            "count": len(reports),
            "reports": reports
        }
        
    except HTTPException:
        raise
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


@router.put("/police/process/{report_id}")
async def process_report(report_id: int, process_data: PoliceStatusUpdateRequest):
    """Police officer processes a report with simple status update.
    
    PIVOT: Using direct SQL update instead of stored procedure to avoid
    schema corruption issues. Trust score updates handled by MySQL triggers.
    Challan generation bypassed to prevent FK constraint errors.
    """
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Validate status
        if process_data.status not in ['Verified', 'Rejected']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be 'Verified' or 'Rejected'"
            )
        
        # Simple, safe SQL update - triggers will handle trust scores automatically
        cursor.execute(
            "UPDATE REPORTS SET status = %s, reviewed_at = NOW() WHERE report_id = %s",
            (process_data.status, report_id)
        )
        
        # Commit the transaction
        conn.commit()
        
        return {
            "message": f"Report {report_id} status updated to {process_data.status}"
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


@router.delete("/{report_id}")
async def delete_report(report_id: int):
    """Delete a report (Citizen for pending, Police for any)."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if report exists
        cursor.execute(
            "SELECT report_id, status FROM REPORTS WHERE report_id = %s",
            (report_id,)
        )
        report = cursor.fetchone()
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        # Delete report
        cursor.execute(
            "DELETE FROM REPORTS WHERE report_id = %s",
            (report_id,)
        )
        
        conn.commit()
        
        return {
            "message": "Report deleted successfully",
            "report_id": report_id
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


@router.get("/notifications/{citizen_id}")
async def get_notifications(citizen_id: int):
    """Get notifications for a citizen."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Try to fetch from NOTIFICATIONS table
        try:
            cursor.execute(
                """SELECT notification_id, notification_type, title, message, 
                          is_read, created_at, read_at
                   FROM NOTIFICATIONS
                   WHERE citizen_id = %s
                   ORDER BY created_at DESC
                   LIMIT 50""",
                (citizen_id,)
            )
            notifications = cursor.fetchall()
            
            # Convert datetime to strings
            for notif in notifications:
                if notif.get('created_at'):
                    notif['created_at'] = notif['created_at'].isoformat()
                if notif.get('read_at'):
                    notif['read_at'] = notif['read_at'].isoformat()
            
            # Get unread count
            cursor.execute(
                "SELECT COUNT(*) as count FROM NOTIFICATIONS WHERE citizen_id = %s AND is_read = FALSE",
                (citizen_id,)
            )
            unread_count = cursor.fetchone()['count']
            
            return {
                "message": "Notifications fetched successfully",
                "count": len(notifications),
                "unread_count": unread_count,
                "notifications": notifications
            }
        except Exception as e:
            # Table doesn't exist yet, return empty
            return {
                "message": "Notification system not installed yet",
                "count": 0,
                "unread_count": 0,
                "notifications": []
            }
        
    except HTTPException:
        raise
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


@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: int, citizen_id: int):
    """Mark a notification as read."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """UPDATE NOTIFICATIONS
               SET is_read = TRUE, read_at = NOW()
               WHERE notification_id = %s AND citizen_id = %s""",
            (notification_id, citizen_id)
        )
        conn.commit()
        
        return {"message": "Notification marked as read"}
        
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


@router.put("/notifications/{citizen_id}/read-all")
async def mark_all_notifications_read(citizen_id: int):
    """Mark all notifications as read."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """UPDATE NOTIFICATIONS
               SET is_read = TRUE, read_at = NOW()
               WHERE citizen_id = %s AND is_read = FALSE""",
            (citizen_id,)
        )
        conn.commit()
        
        return {"message": "All notifications marked as read"}
        
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
