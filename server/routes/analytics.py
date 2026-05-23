"""
Traffic Violation Management System — Analytics Routes
Self-contained with pymysql, no external dependencies
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Dict
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


@router.get("/summary")
async def get_dashboard_summary():
    """Get real-time dashboard summary with all counts from database."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Total pending reports
        cursor.execute("SELECT COUNT(*) as total FROM REPORTS WHERE status = 'Pending'")
        pending_result = cursor.fetchone()
        total_pending = pending_result['total'] if pending_result else 0
        
        # Total verified reports
        cursor.execute("SELECT COUNT(*) as total FROM REPORTS WHERE status = 'Verified'")
        verified_result = cursor.fetchone()
        total_verified = verified_result['total'] if verified_result else 0
        
        # Total rejected reports
        cursor.execute("SELECT COUNT(*) as total FROM REPORTS WHERE status = 'Rejected'")
        rejected_result = cursor.fetchone()
        total_rejected = rejected_result['total'] if rejected_result else 0
        
        # Total challans (all)
        cursor.execute("SELECT COUNT(*) as total FROM CHALLANS")
        challans_result = cursor.fetchone()
        total_challans = challans_result['total'] if challans_result else 0
        
        # Total paid challans
        cursor.execute("SELECT COUNT(*) as total FROM CHALLANS WHERE payment_status = 'Paid'")
        paid_result = cursor.fetchone()
        total_paid = paid_result['total'] if paid_result else 0
        
        # Total unpaid challans
        cursor.execute("SELECT COUNT(*) as total FROM CHALLANS WHERE payment_status = 'Unpaid'")
        unpaid_result = cursor.fetchone()
        total_unpaid = unpaid_result['total'] if unpaid_result else 0
        
        # Total revenue collected (SUM of paid challans)
        cursor.execute("SELECT SUM(total_amount) as revenue FROM CHALLANS WHERE payment_status = 'Paid'")
        revenue_result = cursor.fetchone()
        total_revenue = float(revenue_result['revenue']) if revenue_result['revenue'] else 0.0
        
        # Total citizens
        cursor.execute("SELECT COUNT(*) as total FROM CITIZENS")
        citizens_result = cursor.fetchone()
        total_citizens = citizens_result['total'] if citizens_result else 0
        
        # Total vehicles
        cursor.execute("SELECT COUNT(*) as total FROM VEHICLES")
        vehicles_result = cursor.fetchone()
        total_vehicles = vehicles_result['total'] if vehicles_result else 0
        
        return {
            "message": "Dashboard summary fetched successfully",
            "data": {
                "reports": {
                    "pending": total_pending,
                    "verified": total_verified,
                    "rejected": total_rejected,
                    "total": total_pending + total_verified + total_rejected
                },
                "challans": {
                    "total": total_challans,
                    "paid": total_paid,
                    "unpaid": total_unpaid,
                    "total_revenue": total_revenue
                },
                "system": {
                    "total_citizens": total_citizens,
                    "total_vehicles": total_vehicles
                }
            }
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


@router.get("/police-summary")
async def get_police_summary():
    """Get police dashboard summary with real-time counts from database."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Total processed (Verified + Rejected)
        cursor.execute(
            "SELECT COUNT(*) as total FROM REPORTS WHERE status IN ('Verified', 'Rejected')"
        )
        processed_result = cursor.fetchone()
        total_processed = processed_result['total'] if processed_result else 0
        
        # Pending count
        cursor.execute(
            "SELECT COUNT(*) as total FROM REPORTS WHERE status = 'Pending'"
        )
        pending_result = cursor.fetchone()
        pending_count = pending_result['total'] if pending_result else 0
        
        # Verified count
        cursor.execute(
            "SELECT COUNT(*) as total FROM REPORTS WHERE status = 'Verified'"
        )
        verified_result = cursor.fetchone()
        verified_count = verified_result['total'] if verified_result else 0
        
        # Rejected count
        cursor.execute(
            "SELECT COUNT(*) as total FROM REPORTS WHERE status = 'Rejected'"
        )
        rejected_result = cursor.fetchone()
        rejected_count = rejected_result['total'] if rejected_result else 0
        
        # Fines collected (SUM from CHALLANS table)
        cursor.execute(
            "SELECT SUM(total_amount) as total FROM CHALLANS WHERE payment_status = 'Paid'"
        )
        fines_result = cursor.fetchone()
        fines_collected = float(fines_result['total']) if fines_result['total'] else 0.0
        
        # Active challans (Unpaid)
        cursor.execute(
            "SELECT COUNT(*) as total FROM CHALLANS WHERE payment_status = 'Unpaid'"
        )
        active_result = cursor.fetchone()
        active_challans = active_result['total'] if active_result else 0
        
        return {
            "message": "Police summary fetched successfully",
            "data": {
                "total_processed": total_processed,
                "pending_count": pending_count,
                "verified_count": verified_count,
                "rejected_count": rejected_count,
                "fines_collected": fines_collected,
                "active_challans": active_challans
            }
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


@router.get("/leaderboard")
async def get_leaderboard():
    """Get top 50 citizens ranked by trust_score (Global Leaderboard)."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get top 50 citizens by trust_score
        cursor.execute(
            """SELECT 
                   citizen_id,
                   full_name,
                   email,
                   trust_score,
                   reward_points,
                   created_at
               FROM CITIZENS
               ORDER BY trust_score DESC, reward_points DESC
               LIMIT 50"""
        )
        
        leaderboard = cursor.fetchall()
        
        # Convert datetime to string and add rank
        for idx, citizen in enumerate(leaderboard, 1):
            citizen['rank'] = idx
            if citizen.get('created_at'):
                citizen['created_at'] = citizen['created_at'].isoformat()
        
        return {
            "message": "Leaderboard fetched successfully",
            "count": len(leaderboard),
            "data": leaderboard
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


@router.get("/citizen/{citizen_id}")
async def get_citizen_analytics(citizen_id: int):
    """Get analytics for a specific citizen (personal data only)."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get citizen's total reports
        cursor.execute(
            "SELECT COUNT(*) as total FROM REPORTS WHERE citizen_id = %s",
            (citizen_id,)
        )
        total_result = cursor.fetchone()
        total_reports = total_result['total'] if total_result else 0
        
        # Get citizen's pending reports
        cursor.execute(
            "SELECT COUNT(*) as total FROM REPORTS WHERE citizen_id = %s AND status = 'Pending'",
            (citizen_id,)
        )
        pending_result = cursor.fetchone()
        total_pending = pending_result['total'] if pending_result else 0
        
        # Get citizen's verified reports
        cursor.execute(
            "SELECT COUNT(*) as total FROM REPORTS WHERE citizen_id = %s AND status = 'Verified'",
            (citizen_id,)
        )
        verified_result = cursor.fetchone()
        total_verified = verified_result['total'] if verified_result else 0
        
        # Get citizen's rejected reports
        cursor.execute(
            "SELECT COUNT(*) as total FROM REPORTS WHERE citizen_id = %s AND status = 'Rejected'",
            (citizen_id,)
        )
        rejected_result = cursor.fetchone()
        total_rejected = rejected_result['total'] if rejected_result else 0
        
        # Get citizen's trust score
        cursor.execute(
            "SELECT trust_score FROM CITIZENS WHERE citizen_id = %s",
            (citizen_id,)
        )
        citizen_result = cursor.fetchone()
        trust_score = citizen_result['trust_score'] if citizen_result else 50
        
        return {
            "message": "Citizen analytics fetched successfully",
            "data": {
                "total_reports": total_reports,
                "total_pending": total_pending,
                "total_verified": total_verified,
                "total_rejected": total_rejected,
                "trust_score": trust_score
            }
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


@router.get("/police/system")
async def get_system_analytics():
    """Get global system analytics for police/admin."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Total reports
        cursor.execute("SELECT COUNT(*) as total FROM REPORTS")
        total_result = cursor.fetchone()
        total_reports = total_result['total'] if total_result else 0
        
        # Total pending
        cursor.execute("SELECT COUNT(*) as total FROM REPORTS WHERE status = 'Pending'")
        pending_result = cursor.fetchone()
        total_pending = pending_result['total'] if pending_result else 0
        
        # Total verified
        cursor.execute("SELECT COUNT(*) as total FROM REPORTS WHERE status = 'Verified'")
        verified_result = cursor.fetchone()
        total_verified = verified_result['total'] if verified_result else 0
        
        # Total rejected
        cursor.execute("SELECT COUNT(*) as total FROM REPORTS WHERE status = 'Rejected'")
        rejected_result = cursor.fetchone()
        total_rejected = rejected_result['total'] if rejected_result else 0
        
        # Total citizens
        cursor.execute("SELECT COUNT(*) as total FROM CITIZENS")
        citizens_result = cursor.fetchone()
        total_citizens = citizens_result['total'] if citizens_result else 0
        
        # Total police officers
        cursor.execute("SELECT COUNT(*) as total FROM POLICE_OFFICERS")
        police_result = cursor.fetchone()
        total_police = police_result['total'] if police_result else 0
        
        return {
            "message": "System analytics fetched successfully",
            "data": {
                "total_reports": total_reports,
                "total_pending": total_pending,
                "total_verified": total_verified,
                "total_rejected": total_rejected,
                "total_citizens": total_citizens,
                "total_police": total_police
            }
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


@router.get("/violation-types")
async def get_violation_types():
    """Get violation type distribution for pie chart (groups by actual violation types)."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get count of each violation type (NOT status)
        cursor.execute(
            """SELECT violation_type, COUNT(*) as count
               FROM REPORTS
               WHERE violation_type IS NOT NULL AND violation_type != ''
               GROUP BY violation_type
               ORDER BY count DESC"""
        )
        
        violation_types = cursor.fetchall()
        
        return {
            "message": "Violation types fetched successfully",
            "data": violation_types
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


@router.get("/recent-activity")
async def get_recent_activity(limit: int = 10):
    """Get recent report activity."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """SELECT r.report_id, r.violation_type, r.status, r.reported_at,
                      c.full_name as reporter_name
               FROM REPORTS r
               JOIN CITIZENS c ON r.citizen_id = c.citizen_id
               ORDER BY r.reported_at DESC
               LIMIT %s""",
            (limit,)
        )
        
        activities = cursor.fetchall()
        
        # Convert datetime to string
        for activity in activities:
            if activity.get('reported_at'):
                activity['reported_at'] = activity['reported_at'].isoformat()
        
        return {
            "message": "Recent activity fetched successfully",
            "data": activities
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


@router.get("/status-trend")
async def get_status_trend():
    """Get daily report status trend for the last 7 days."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """SELECT DATE(reported_at) as date, status, COUNT(*) as count
               FROM REPORTS
               WHERE reported_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
               GROUP BY DATE(reported_at), status
               ORDER BY date ASC"""
        )
        
        trends = cursor.fetchall()
        
        # Convert date to string
        for trend in trends:
            if trend.get('date'):
                trend['date'] = trend['date'].isoformat()
        
        return {
            "message": "Status trend fetched successfully",
            "data": trends
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


@router.get("/heatmap-data")
async def get_heatmap_data():
    """Get geospatial data for traffic hotspot visualization - ALL verified reports."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Fetch ALL verified reports with location coordinates (no grouping)
        cursor.execute(
            """SELECT 
                   report_id,
                   violation_type,
                   location_coords,
                   location_address,
                   date_reported
               FROM REPORTS
               WHERE status = 'Verified' 
                 AND location_coords IS NOT NULL 
                 AND location_coords <> ''
               ORDER BY date_reported DESC"""
        )
        
        results = cursor.fetchall()
        heatmap_data = []
        
        for row in results:
            coords = row['location_coords']
            if coords and ',' in coords:
                try:
                    lat, lng = map(float, coords.split(','))
                    
                    # Validate coordinates are within reasonable range (Chennai area)
                    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                        continue
                    
                    heatmap_data.append({
                        'id': row['report_id'],
                        'violation_type': row['violation_type'] or 'Unknown Violation',
                        'lat': lat,
                        'lng': lng,
                        'location_address': row['location_address'] or 'Location not specified',
                        'date': row['date_reported'].isoformat() if row.get('date_reported') else None
                    })
                except (ValueError, TypeError):
                    # Skip invalid coordinates
                    continue
        
        return {
            "message": "Heatmap data fetched successfully",
            "total_reports": len(heatmap_data),
            "center": {"lat": 13.0827, "lng": 80.2707},  # Chennai
            "zoom": 12,
            "data": heatmap_data
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
        if cursor:
            cursor.close()
        if conn and conn.open:
            conn.close()
