"""  
Traffic Violation Management System — Challans Routes
Self-contained with pymysql, handles citizen payments
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import pymysql
from datetime import datetime, date, timedelta

router = APIRouter()

# Request models
class ChallanCreateRequest(BaseModel):
    report_id: int
    rule_id: int
    badge_no: str
    total_amount: float
    notes: Optional[str] = None

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


@router.post("/create")
async def create_challan(challan_data: ChallanCreateRequest):
    """Create challan after police verify report - issued to violator's vehicle."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Step 1: Get report details including plate_no and citizen_id
        cursor.execute("""
            SELECT r.report_id, r.plate_no, r.citizen_id as reporter_id, 
                   r.description, r.location_address, r.status,
                   v.citizen_id as violator_citizen_id, v.owner_name as violator_name,
                   v.vehicle_model, v.vehicle_type,
                   c.full_name as reporter_full_name, c.phone_no as reporter_phone,
                   c.email as reporter_email
            FROM REPORTS r
            LEFT JOIN VEHICLES v ON r.plate_no = v.plate_no
            LEFT JOIN CITIZENS c ON r.citizen_id = c.citizen_id
            WHERE r.report_id = %s
        """, (challan_data.report_id,))
        
        report = cursor.fetchone()
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        # Safely check status
        if report.get('status') == 'Verified':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Report has already been verified and challan issued"
            )
        
        # Step 2: Create VIOLATION_EVENT
        cursor.execute("""
            INSERT INTO VIOLATION_EVENTS (report_id, rule_id, plate_no, event_timestamp, notes)
            VALUES (%s, %s, %s, NOW(), %s)
        """, (challan_data.report_id, challan_data.rule_id, report['plate_no'], challan_data.notes or ''))
        event_id = cursor.lastrowid
        
        # Step 3: Create CHALLAN linked to violator's citizen_id
        # If violator not in system, link to reporter (fallback)
        violator_citizen_id = report.get('violator_citizen_id') or report.get('reporter_id')
        
        cursor.execute("""
            INSERT INTO CHALLANS (event_id, citizen_id, badge_no, total_amount, 
                                 payment_status, issue_date, due_date)
            VALUES (%s, %s, %s, %s, 'Unpaid', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY))
        """, (event_id, violator_citizen_id, challan_data.badge_no, challan_data.total_amount))
        
        challan_id = cursor.lastrowid
        
        # Step 4: Update report status to Verified
        cursor.execute("""
            UPDATE REPORTS SET status = 'Verified', reviewed_at = NOW() 
            WHERE report_id = %s
        """, (challan_data.report_id,))
        
        # Check if habitual offender penalty was applied
        recent_challans_count = 0
        habitual_offender = False
        if report['plate_no']:
            cursor.execute(
                """SELECT COUNT(*) as count
                   FROM CHALLANS c
                   JOIN VIOLATION_EVENTS ve ON c.event_id = ve.event_id
                   WHERE ve.plate_no = %s
                     AND c.issue_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                     AND c.payment_status IN ('Unpaid', 'Paid', 'Overdue')""",
                (report['plate_no'],)
            )
            count_result = cursor.fetchone()
            recent_challans_count = count_result['count']
            habitual_offender = recent_challans_count >= 3
        
        conn.commit()
        
        return {
            "message": "Challan created successfully",
            "challan_id": challan_id,
            "event_id": event_id,
            "report_id": challan_data.report_id,
            "plate_no": report['plate_no'],
            "violator_name": report.get('violator_name') or 'Unknown',
            "violator_citizen_id": violator_citizen_id,
            "total_amount": challan_data.total_amount,
            "final_amount": float(challan_data.total_amount * 2 if habitual_offender else challan_data.total_amount),
            "habitual_offender_penalty_applied": habitual_offender,
            "recent_violations_count": recent_challans_count,
            "due_date": (date.today() + timedelta(days=30)).isoformat()
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
async def get_citizen_challans(citizen_id: int):
    """Get all challans for a specific citizen with full details."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # JOIN across CHALLANS, VIOLATION_EVENTS, REPORTS, and VIOLATION_RULES
        cursor.execute(
            """SELECT 
                   c.challan_id,
                   c.total_amount,
                   c.payment_status,
                   c.issue_date,
                   c.due_date,
                   c.paid_at,
                   c.transaction_ref,
                   vr.rule_name,
                   vr.rule_code,
                   ve.plate_no,
                   ve.event_timestamp,
                   r.location_address,
                   r.description as violation_description
               FROM CHALLANS c
               JOIN VIOLATION_EVENTS ve ON c.event_id = ve.event_id
               JOIN REPORTS r ON ve.report_id = r.report_id
               JOIN VIOLATION_RULES vr ON ve.rule_id = vr.rule_id
               WHERE c.citizen_id = %s
               ORDER BY c.issue_date DESC""",
            (citizen_id,)
        )
        
        challans = cursor.fetchall()
        
        # Convert date/datetime objects to strings
        for challan in challans:
            if challan.get('issue_date'):
                challan['issue_date'] = challan['issue_date'].isoformat()
            if challan.get('due_date'):
                challan['due_date'] = challan['due_date'].isoformat()
            if challan.get('paid_at'):
                challan['paid_at'] = challan['paid_at'].isoformat()
            if challan.get('event_timestamp'):
                challan['event_timestamp'] = challan['event_timestamp'].isoformat()
        
        return {
            "message": "Challans fetched successfully",
            "count": len(challans),
            "challans": challans
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


@router.get("/my")
async def get_my_challans(citizen_id: int):
    """Get challans for the logged-in citizen (violator) with evidence photos."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # JOIN across CHALLANS, VIOLATION_EVENTS, REPORTS, VIOLATION_RULES, and EVIDENCE_PHOTOS
        cursor.execute(
            """SELECT 
                   c.challan_id,
                   c.total_amount,
                   c.payment_status,
                   c.issue_date,
                   c.due_date,
                   c.paid_at,
                   c.transaction_ref,
                   vr.rule_name,
                   vr.rule_code,
                   ve.plate_no,
                   ve.event_timestamp,
                   r.location_address,
                   r.description as violation_description,
                   GROUP_CONCAT(DISTINCT ep.photo_id ORDER BY ep.photo_id) as photo_ids,
                   GROUP_CONCAT(DISTINCT ep.image_url ORDER BY ep.photo_id) as photo_urls,
                   GROUP_CONCAT(DISTINCT ep.caption ORDER BY ep.photo_id) as photo_captions
               FROM CHALLANS c
               JOIN VIOLATION_EVENTS ve ON c.event_id = ve.event_id
               JOIN REPORTS r ON ve.report_id = r.report_id
               JOIN VIOLATION_RULES vr ON ve.rule_id = vr.rule_id
               LEFT JOIN EVIDENCE_PHOTOS ep ON r.report_id = ep.report_id
               WHERE c.citizen_id = %s
               GROUP BY c.challan_id
               ORDER BY c.issue_date DESC""",
            (citizen_id,)
        )
        
        challans = cursor.fetchall()
        
        # Convert date/datetime objects to strings and parse evidence photos
        for challan in challans:
            if challan.get('issue_date'):
                challan['issue_date'] = challan['issue_date'].isoformat()
            if challan.get('due_date'):
                challan['due_date'] = challan['due_date'].isoformat()
            if challan.get('paid_at'):
                challan['paid_at'] = challan['paid_at'].isoformat()
            if challan.get('event_timestamp'):
                challan['event_timestamp'] = challan['event_timestamp'].isoformat()
            
            # Parse evidence photos from GROUP_CONCAT results
            evidence_photos = []
            if challan.get('photo_ids'):
                photo_ids = challan['photo_ids'].split(',')
                photo_urls = challan['photo_urls'].split(',') if challan.get('photo_urls') else []
                photo_captions = challan['photo_captions'].split(',') if challan.get('photo_captions') else []
                
                for i in range(len(photo_ids)):
                    evidence_photos.append({
                        'photo_id': photo_ids[i],
                        'image_url': photo_urls[i] if i < len(photo_urls) else '',
                        'caption': photo_captions[i] if i < len(photo_captions) else ''
                    })
            
            challan['evidence_photos'] = evidence_photos
            # Remove raw concatenated fields
            challan.pop('photo_ids', None)
            challan.pop('photo_urls', None)
            challan.pop('photo_captions', None)
        
        return {
            "message": "My challans fetched successfully",
            "count": len(challans),
            "challans": challans
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


@router.get("/report/{report_id}")
async def get_report_for_challan(report_id: int):
    """Get single report details with violator and reporter info for challan creation."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT r.report_id, r.plate_no, r.citizen_id as reporter_id, 
                   r.description, r.location_address, r.evidence_path, r.status,
                   r.date_reported, r.violation_type,
                   v.citizen_id as violator_citizen_id, 
                   v.owner_name as violator_name,
                   v.vehicle_model, v.vehicle_type,
                   v.owner_type,
                   c.full_name as reporter_full_name, 
                   c.phone_no as reporter_phone,
                   c.email as reporter_email,
                   c.trust_score as reporter_trust_score
            FROM REPORTS r
            LEFT JOIN VEHICLES v ON r.plate_no = v.plate_no
            LEFT JOIN CITIZENS c ON r.citizen_id = c.citizen_id
            WHERE r.report_id = %s
        """, (report_id,))
        
        report = cursor.fetchone()
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        # Convert date/datetime objects to strings
        if report.get('date_reported'):
            report['date_reported'] = report['date_reported'].isoformat()
        
        return {
            "message": "Report fetched successfully",
            "report": report
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


@router.put("/pay/{challan_id}")
async def pay_challan(challan_id: int):
    """Update challan payment status to 'Paid'."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if challan exists
        cursor.execute(
            "SELECT challan_id, payment_status, total_amount FROM CHALLANS WHERE challan_id = %s",
            (challan_id,)
        )
        challan = cursor.fetchone()
        
        if not challan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Challan not found"
            )
        
        if challan['payment_status'] == 'Paid':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Challan is already paid"
            )
        
        # Update payment status
        cursor.execute(
            """UPDATE CHALLANS 
               SET payment_status = 'Paid', 
                   paid_at = %s,
                   transaction_ref = CONCAT('TXN', UNIX_TIMESTAMP())
               WHERE challan_id = %s""",
            (datetime.utcnow(), challan_id)
        )
        
        conn.commit()
        
        return {
            "message": "Payment successful",
            "challan_id": challan_id,
            "amount_paid": float(challan['total_amount']),
            "payment_status": "Paid"
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


@router.delete("/{challan_id}")
async def delete_challan(challan_id: int):
    """Delete a challan (Police only)."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if challan exists
        cursor.execute(
            "SELECT challan_id FROM CHALLANS WHERE challan_id = %s",
            (challan_id,)
        )
        challan = cursor.fetchone()
        
        if not challan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Challan not found"
            )
        
        # Delete challan
        cursor.execute(
            "DELETE FROM CHALLANS WHERE challan_id = %s",
            (challan_id,)
        )
        
        conn.commit()
        
        return {
            "message": "Challan deleted successfully",
            "challan_id": challan_id
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
