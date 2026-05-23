"""
Traffic Violation Management System — Appeals Routes
Handles challan dispute submission and police review
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import pymysql
from datetime import datetime

router = APIRouter()

# Direct database configuration
DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'root',
    'password': 'yvpandi@11',
    'database': 'traffic_violation_db',
    'cursorclass': pymysql.cursors.DictCursor
}

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


class SubmitAppealRequest(BaseModel):
    challan_id: int
    citizen_id: int
    reason: str


class ReviewAppealRequest(BaseModel):
    status: str  # 'Accepted' or 'Rejected'
    review_notes: Optional[str] = None
    badge_no: str


@router.post("/submit")
async def submit_appeal(request: SubmitAppealRequest):
    """Citizen submits a challan dispute appeal."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Validate reason length
        if len(request.reason.strip()) < 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Appeal reason must be at least 50 characters"
            )
        
        # Check challan exists and is eligible for dispute
        cursor.execute(
            """SELECT challan_id, citizen_id, payment_status, total_amount
               FROM CHALLANS WHERE challan_id = %s""",
            (request.challan_id,)
        )
        challan = cursor.fetchone()
        
        if not challan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Challan not found"
            )
        
        if challan['citizen_id'] != request.citizen_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This challan does not belong to you"
            )
        
        if challan['payment_status'] not in ['Unpaid', 'Overdue']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot dispute challan with status: {challan['payment_status']}"
            )
        
        # Check if appeal already exists
        cursor.execute(
            """SELECT appeal_id, status FROM APPEALS 
               WHERE challan_id = %s""",
            (request.challan_id,)
        )
        existing_appeals = cursor.fetchall()
        
        # Check if there's a pending appeal
        pending_appeals = [a for a in existing_appeals if a['status'] in ['Pending', 'Under Review']]
        if pending_appeals:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This challan already has a pending appeal"
            )
        
        # ENFORCE MAX APPEALS LIMIT: Maximum 1 appeal per challan
        if len(existing_appeals) >= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum appeal limit reached. You can only submit 1 appeal per challan."
            )
        
        # Start transaction
        conn.begin()
        
        # Insert appeal
        cursor.execute(
            """INSERT INTO APPEALS (challan_id, citizen_id, reason, status)
               VALUES (%s, %s, %s, 'Pending')""",
            (request.challan_id, request.citizen_id, request.reason.strip())
        )
        appeal_id = cursor.lastrowid
        
        # Update challan status to Disputed
        cursor.execute(
            """UPDATE CHALLANS SET payment_status = 'Disputed'
               WHERE challan_id = %s""",
            (request.challan_id,)
        )
        
        # Create notification for police (all officers)
        try:
            cursor.execute(
                """INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message, related_id)
                   SELECT %s, 'New Appeal', 
                          CONCAT('New appeal submitted for Challan #', %s, ' - ', vr.rule_name),
                          %s
                   FROM CHALLANS c
                   JOIN VIOLATION_EVENTS ve ON c.event_id = ve.event_id
                   JOIN VIOLATION_RULES vr ON ve.rule_id = vr.rule_id
                   WHERE c.challan_id = %s""",
                (request.citizen_id, request.challan_id, appeal_id, request.challan_id)
            )
        except Exception as notif_err:
            # Notifications table might not exist yet - log but don't fail
            print(f"Warning: Could not create notification: {notif_err}")
        
        conn.commit()
        
        return {
            "message": "Appeal submitted successfully",
            "appeal_id": appeal_id,
            "challan_id": request.challan_id,
            "status": "Pending",
            "note": "Your challan status has been updated to 'Disputed' pending police review"
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


@router.get("/citizen/{citizen_id}")
async def get_citizen_appeals(citizen_id: int):
    """Get all appeals for a citizen with challan details."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """SELECT a.appeal_id, a.challan_id, a.reason, a.status,
                      a.created_at, a.reviewed_at, a.review_notes,
                      c.total_amount, c.payment_status, c.issue_date, c.due_date,
                      vr.rule_name, vr.rule_code,
                      ve.plate_no
               FROM APPEALS a
               JOIN CHALLANS c ON a.challan_id = c.challan_id
               JOIN VIOLATION_EVENTS ve ON c.event_id = ve.event_id
               JOIN VIOLATION_RULES vr ON ve.rule_id = vr.rule_id
               WHERE a.citizen_id = %s
               ORDER BY a.created_at DESC""",
            (citizen_id,)
        )
        
        appeals = cursor.fetchall()
        
        # Convert datetime to string
        for appeal in appeals:
            if appeal.get('created_at'):
                appeal['created_at'] = appeal['created_at'].isoformat()
            if appeal.get('reviewed_at'):
                appeal['reviewed_at'] = appeal['reviewed_at'].isoformat()
            if appeal.get('issue_date'):
                appeal['issue_date'] = appeal['issue_date'].isoformat()
            if appeal.get('due_date'):
                appeal['due_date'] = appeal['due_date'].isoformat()
        
        return {
            "message": "Appeals fetched successfully",
            "count": len(appeals),
            "appeals": appeals
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


@router.get("/police/pending")
async def get_pending_appeals():
    """Get all pending/under review appeals for police review."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """SELECT a.appeal_id, a.challan_id, a.citizen_id, a.reason, 
                      a.status, a.created_at, a.review_notes,
                      c.total_amount, c.payment_status, c.issue_date,
                      cit.full_name as citizen_name, cit.email as citizen_email,
                      vr.rule_name, vr.rule_code,
                      ve.plate_no, ve.location_coords,
                      r.description as violation_description
               FROM APPEALS a
               JOIN CHALLANS c ON a.challan_id = c.challan_id
               JOIN VIOLATION_EVENTS ve ON c.event_id = ve.event_id
               JOIN VIOLATION_RULES vr ON ve.rule_id = vr.rule_id
               JOIN CITIZENS cit ON a.citizen_id = cit.citizen_id
               JOIN REPORTS r ON ve.report_id = r.report_id
               WHERE a.status IN ('Pending', 'Under Review')
               ORDER BY a.created_at ASC""",
            ()
        )
        
        appeals = cursor.fetchall()
        
        # Convert datetime to string
        for appeal in appeals:
            if appeal.get('created_at'):
                appeal['created_at'] = appeal['created_at'].isoformat()
            if appeal.get('issue_date'):
                appeal['issue_date'] = appeal['issue_date'].isoformat()
        
        return {
            "message": "Pending appeals fetched successfully",
            "count": len(appeals),
            "appeals": appeals
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


@router.put("/{appeal_id}/review")
async def review_appeal(appeal_id: int, request: ReviewAppealRequest):
    """Police officer reviews and decides on an appeal."""
    conn = None
    cursor = None
    
    try:
        # Validate status
        if request.status not in ['Accepted', 'Rejected']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be 'Accepted' or 'Rejected'"
            )
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check appeal exists
        cursor.execute(
            """SELECT appeal_id, challan_id, citizen_id, status
               FROM APPEALS WHERE appeal_id = %s""",
            (appeal_id,)
        )
        appeal = cursor.fetchone()
        
        if not appeal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appeal not found"
            )
        
        if appeal['status'] not in ['Pending', 'Under Review']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Appeal already {appeal['status']}"
            )
        
        # Start transaction
        conn.begin()
        
        # Update appeal with decision
        cursor.execute(
            """UPDATE APPEALS 
               SET status = %s,
                   reviewed_by = %s,
                   reviewed_at = NOW(),
                   review_notes = %s
               WHERE appeal_id = %s""",
            (request.status, request.badge_no, request.review_notes, appeal_id)
        )
        
        # Update challan based on decision
        if request.status == 'Accepted':
            # Waive the challan
            cursor.execute(
                """UPDATE CHALLANS SET payment_status = 'Waived'
                   WHERE challan_id = %s""",
                (appeal['challan_id'],)
            )
        else:  # Rejected
            # Revert to Unpaid
            cursor.execute(
                """UPDATE CHALLANS SET payment_status = 'Unpaid'
                   WHERE challan_id = %s""",
                (appeal['challan_id'],)
            )
        
        # Create notification for citizen about appeal decision
        try:
            decision_message = f"Your appeal for Challan #{appeal['challan_id']} has been {request.status.lower()}." if request.status == 'Accepted' else f"Your appeal for Challan #{appeal['challan_id']} has been {request.status.lower()}."
            cursor.execute(
                """INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message, related_id)
                   VALUES (%s, 'Appeal Status', %s, %s)""",
                (appeal['citizen_id'], decision_message, appeal_id)
            )
        except Exception as notif_err:
            print(f"Warning: Could not create notification: {notif_err}")
        
        conn.commit()
        
        return {
            "message": f"Appeal {request.status.lower()} successfully",
            "appeal_id": appeal_id,
            "challan_id": appeal['challan_id'],
            "new_challan_status": 'Waived' if request.status == 'Accepted' else 'Unpaid',
            "decision": request.status
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
