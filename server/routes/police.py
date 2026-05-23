"""
Traffic Violation Management System — Police Routes
Pending reports dashboard, verification, rejection, and performance stats
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
import logging

from database import get_cursor
from middleware.auth import get_current_user, require_police

router = APIRouter()
logger = logging.getLogger("tvms.police")


class VerifyReportRequest(BaseModel):
    rule_id: int


class RejectReportRequest(BaseModel):
    reason: str


@router.get("/pending")
async def get_pending_reports(current_user: dict = Depends(require_police)):
    """Fetch pending reports from the Pending_Reports_Dashboard view."""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute("SELECT * FROM Pending_Reports_Dashboard")
            reports = cursor.fetchall()
            
            # Convert datetime objects to strings
            for report in reports:
                if report.get("date_reported"):
                    report["date_reported"] = report["date_reported"].isoformat()
            
            return reports
            
    except Exception as e:
        logger.error(f"Fetch pending reports error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch pending reports"
        )


@router.post("/verify/{report_id}")
async def verify_report(
    report_id: int,
    verify_data: VerifyReportRequest,
    current_user: dict = Depends(require_police)
):
    """
    Verify a report and issue challan using stored procedure.
    This triggers the trust score increase for the reporter.
    """
    badge_no = current_user["id"]
    
    try:
        with get_cursor() as (cursor, conn):
            # Call stored procedure: sp_issue_challan
            cursor.callproc("sp_issue_challan", [
                report_id,
                verify_data.rule_id,
                badge_no,
                None,  # plate_no (will be fetched from report)
                0,     # p_challan_id (OUT)
                0,     # p_result_code (OUT)
                ""     # p_result_msg (OUT)
            ])
            
            # Fetch OUT parameters
            cursor.execute("SELECT @_sp_issue_challan_arg5, @_sp_issue_challan_arg6, @_sp_issue_challan_arg7")
            result = cursor.fetchone()
            
            challan_id = result[0]
            result_code = result[1]
            result_msg = result[2]
            
            conn.commit()
            
            if result_code <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=result_msg
                )
            
            return {
                "message": result_msg,
                "challan_id": challan_id,
                "report_id": report_id
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verify report error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify report"
        )


@router.post("/reject/{report_id}")
async def reject_report(
    report_id: int,
    reject_data: RejectReportRequest,
    current_user: dict = Depends(require_police)
):
    """
    Reject a report using stored procedure.
    This triggers the trust score penalty for the reporter.
    """
    badge_no = current_user["id"]
    
    try:
        with get_cursor() as (cursor, conn):
            # Call stored procedure: sp_reject_report
            cursor.callproc("sp_reject_report", [
                report_id,
                badge_no,
                reject_data.reason,
                0,  # p_result_code (OUT)
                ""  # p_result_msg (OUT)
            ])
            
            # Fetch OUT parameters
            cursor.execute("SELECT @_sp_reject_report_arg4, @_sp_reject_report_arg5")
            result = cursor.fetchone()
            
            result_code = result[0]
            result_msg = result[1]
            
            conn.commit()
            
            if result_code <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=result_msg
                )
            
            return {
                "message": result_msg,
                "report_id": report_id
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reject report error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reject report"
        )


@router.get("/rules")
async def get_violation_rules(current_user: dict = Depends(require_police)):
    """Fetch all active violation rules."""
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute(
                """SELECT rule_id, rule_code, rule_name, description, 
                          base_fine_amount, severity, violation_time
                   FROM VIOLATION_RULES
                   WHERE is_active = TRUE
                   ORDER BY severity, rule_code"""
            )
            rules = cursor.fetchall()
            
            # Convert Decimal to float for JSON serialization
            for rule in rules:
                if rule.get("base_fine_amount"):
                    rule["base_fine_amount"] = float(rule["base_fine_amount"])
            
            return rules
            
    except Exception as e:
        logger.error(f"Fetch rules error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch violation rules"
        )


@router.get("/performance")
async def get_officer_performance(current_user: dict = Depends(require_police)):
    """Fetch officer performance statistics from view."""
    badge_no = current_user["id"]
    
    try:
        with get_cursor() as (cursor, conn):
            cursor.execute(
                "SELECT * FROM Officer_Performance_View WHERE badge_no = %s",
                (badge_no,)
            )
            performance = cursor.fetchone()
            
            if not performance:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Performance data not found"
                )
            
            # Convert Decimal to float
            if performance.get("revenue_collected"):
                performance["revenue_collected"] = float(performance["revenue_collected"])
            
            return performance
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fetch performance error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch performance data"
        )
