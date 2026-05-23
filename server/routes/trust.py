"""
Traffic Violation Management System — Trust & History Routes
Trust score history, temporal data, and overdue challan flagging
"""
from fastapi import APIRouter, HTTPException, status, Depends
import logging

from database import get_cursor
from middleware.auth import get_current_user, require_citizen, require_police

router = APIRouter()
logger = logging.getLogger("tvms.trust")


@router.get("/history/{citizen_id}")
async def get_trust_history(
    citizen_id: int,
    current_user: dict = Depends(require_citizen)
):
    """
    Fetch citizen's trust score history from Citizen_Trust_History view.
    Only the citizen themselves can access their history.
    """
    # Security: citizens can only view their own history
    if current_user["role"] == "citizen" and str(current_user["id"]) != str(citizen_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own trust history"
        )
    
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute(
                """SELECT history_id, citizen_id, full_name, trust_score,
                          reward_points, account_status, valid_from, valid_to,
                          operation_type, changed_at, changed_by
                   FROM Citizen_Trust_History
                   WHERE citizen_id = %s
                   ORDER BY valid_from DESC""",
                (citizen_id,)
            )
            history = cursor.fetchall()
            
            # Convert datetime objects to strings
            for record in history:
                if record.get("valid_from"):
                    record["valid_from"] = record["valid_from"].isoformat()
                if record.get("valid_to"):
                    record["valid_to"] = record["valid_to"].isoformat()
                if record.get("changed_at"):
                    record["changed_at"] = record["changed_at"].isoformat()
            
            return history
            
    except Exception as e:
        logger.error(f"Fetch trust history error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch trust history"
        )


@router.get("/current/{citizen_id}")
async def get_current_trust_score(
    citizen_id: int,
    current_user: dict = Depends(require_citizen)
):
    """Get citizen's current trust score."""
    # Security: citizens can only view their own score
    if current_user["role"] == "citizen" and str(current_user["id"]) != str(citizen_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own trust score"
        )
    
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute(
                """SELECT citizen_id, full_name, trust_score, reward_points, account_status
                   FROM CITIZENS
                   WHERE citizen_id = %s""",
                (citizen_id,)
            )
            citizen = cursor.fetchone()
            
            if not citizen:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Citizen not found"
                )
            
            return citizen
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fetch trust score error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch trust score"
        )


@router.post("/flag-overdue")
async def flag_overdue_challans(current_user: dict = Depends(require_police)):
    """
    Manually trigger the overdue challan flagging procedure.
    Police officers can run this to flag all overdue challans.
    """
    try:
        with get_cursor() as (cursor, conn):
            # Call stored procedure: sp_flag_overdue_challans
            cursor.callproc("sp_flag_overdue_challans", [0])
            
            # Fetch OUT parameter
            cursor.execute("SELECT @_sp_flag_overdue_challans_arg0")
            result = cursor.fetchone()
            
            flagged_count = result[0] if result else 0
            
            conn.commit()
            
            return {
                "message": f"Overdue challan check completed",
                "flagged_count": flagged_count
            }
            
    except Exception as e:
        logger.error(f"Flag overdue challans error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to flag overdue challans"
        )
