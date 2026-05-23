"""
Traffic Violation Management System — Vehicle Search Routes
Self-contained with pymysql, for police use only
"""
from fastapi import APIRouter, HTTPException, status
import pymysql

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


@router.get("/search/{plate_no}")
async def search_vehicle(plate_no: str):
    """Search vehicle by plate number and get full violation history."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get vehicle details
        cursor.execute(
            """SELECT 
                   plate_no,
                   vehicle_model,
                   vehicle_type,
                   owner_name,
                   owner_type,
                   registered_at
               FROM VEHICLES
               WHERE plate_no = %s""",
            (plate_no,)
        )
        vehicle = cursor.fetchone()
        
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle with plate number '{plate_no}' not found"
            )
        
        # Convert datetime to string
        if vehicle.get('registered_at'):
            vehicle['registered_at'] = vehicle['registered_at'].isoformat()
        
        # Get violation history with challans
        cursor.execute(
            """SELECT 
                   ve.event_id,
                   ve.event_timestamp,
                   ve.location_coords,
                   ve.notes,
                   vr.rule_code,
                   vr.rule_name,
                   vr.base_fine_amount,
                   vr.severity,
                   c.challan_id,
                   c.total_amount,
                   c.payment_status,
                   c.issue_date,
                   c.due_date,
                   c.paid_at
               FROM VIOLATION_EVENTS ve
               JOIN VIOLATION_RULES vr ON ve.rule_id = vr.rule_id
               LEFT JOIN CHALLANS c ON ve.event_id = c.event_id
               WHERE ve.plate_no = %s
               ORDER BY ve.event_timestamp DESC""",
            (plate_no,)
        )
        
        violations = cursor.fetchall()
        
        # Convert date/datetime objects to strings
        for violation in violations:
            if violation.get('event_timestamp'):
                violation['event_timestamp'] = violation['event_timestamp'].isoformat()
            if violation.get('issue_date'):
                violation['issue_date'] = violation['issue_date'].isoformat()
            if violation.get('due_date'):
                violation['due_date'] = violation['due_date'].isoformat()
            if violation.get('paid_at'):
                violation['paid_at'] = violation['paid_at'].isoformat()
            # Convert Decimal to float
            if violation.get('base_fine_amount'):
                violation['base_fine_amount'] = float(violation['base_fine_amount'])
            if violation.get('total_amount'):
                violation['total_amount'] = float(violation['total_amount'])
        
        # Calculate summary statistics
        total_violations = len(violations)
        unpaid_challans = sum(1 for v in violations if v.get('payment_status') == 'Unpaid')
        total_unpaid_amount = sum(
            float(v['total_amount']) for v in violations 
            if v.get('payment_status') == 'Unpaid' and v.get('total_amount')
        )
        
        return {
            "message": "Vehicle search successful",
            "vehicle": vehicle,
            "summary": {
                "total_violations": total_violations,
                "unpaid_challans": unpaid_challans,
                "total_unpaid_amount": total_unpaid_amount
            },
            "violations": violations
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
