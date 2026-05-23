"""  
Traffic Violation Management System — Notification Routes
Handles citizen notification retrieval and read status management
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
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


@router.get("/{citizen_id}")
async def get_notifications(citizen_id: int):
    """Get all notifications for a citizen with unread count."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get unread count
        cursor.execute(
            "SELECT COUNT(*) as unread_count FROM NOTIFICATIONS WHERE citizen_id = %s AND is_read = FALSE",
            (citizen_id,)
        )
        unread_result = cursor.fetchone()
        unread_count = unread_result['unread_count']
        
        # Get notifications (last 50)
        cursor.execute(
            """SELECT notif_id, message, is_read, notif_type, created_at
               FROM NOTIFICATIONS
               WHERE citizen_id = %s
               ORDER BY created_at DESC
               LIMIT 50""",
            (citizen_id,)
        )
        notifications = cursor.fetchall()
        
        # Convert datetime to string
        for notif in notifications:
            if notif.get('created_at'):
                notif['created_at'] = notif['created_at'].isoformat()
        
        return {
            "message": "Notifications fetched successfully",
            "unread_count": unread_count,
            "total_count": len(notifications),
            "notifications": notifications
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


@router.get("/{citizen_id}/unread-count")
async def get_unread_count(citizen_id: int):
    """Get only unread notification count (for navbar badge)."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT COUNT(*) as unread_count FROM NOTIFICATIONS WHERE citizen_id = %s AND is_read = FALSE",
            (citizen_id,)
        )
        result = cursor.fetchone()
        
        return {
            "citizen_id": citizen_id,
            "unread_count": result['unread_count']
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


@router.put("/{notif_id}/read")
async def mark_notification_read(notif_id: int):
    """Mark a single notification as read."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check notification exists
        cursor.execute(
            "SELECT notif_id, is_read FROM NOTIFICATIONS WHERE notif_id = %s",
            (notif_id,)
        )
        notif = cursor.fetchone()
        
        if not notif:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        if notif['is_read']:
            return {
                "message": "Notification already read",
                "notif_id": notif_id
            }
        
        # Mark as read
        cursor.execute(
            "UPDATE NOTIFICATIONS SET is_read = TRUE WHERE notif_id = %s",
            (notif_id,)
        )
        conn.commit()
        
        return {
            "message": "Notification marked as read",
            "notif_id": notif_id
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


@router.put("/read-all/{citizen_id}")
async def mark_all_notifications_read(citizen_id: int):
    """Mark all notifications as read for a citizen."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Mark all as read
        cursor.execute(
            "UPDATE NOTIFICATIONS SET is_read = TRUE WHERE citizen_id = %s AND is_read = FALSE",
            (citizen_id,)
        )
        updated_count = cursor.rowcount
        conn.commit()
        
        return {
            "message": f"Marked {updated_count} notifications as read",
            "citizen_id": citizen_id,
            "updated_count": updated_count,
            "unread_count": 0
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


# Police Notification Endpoints

@router.get("/police/all")
async def get_police_notifications():
    """Get all notifications for police (new appeals, reports, etc.)."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all notifications for police (citizen_id is the reporter/officer)
        cursor.execute(
            """SELECT notif_id, citizen_id, message, is_read, notif_type, created_at
               FROM NOTIFICATIONS
               WHERE notif_type IN ('New Appeal', 'Report Submitted', 'Report Verified', 'Report Rejected')
               ORDER BY created_at DESC
               LIMIT 100""",
            ()
        )
        notifications = cursor.fetchall()
        
        # Get unread count
        cursor.execute(
            "SELECT COUNT(*) as unread_count FROM NOTIFICATIONS WHERE is_read = FALSE AND notif_type IN ('New Appeal', 'Report Submitted', 'Report Verified', 'Report Rejected')"
        )
        unread_result = cursor.fetchone()
        unread_count = unread_result['unread_count']
        
        # Convert datetime to string
        for notif in notifications:
            if notif.get('created_at'):
                notif['created_at'] = notif['created_at'].isoformat()
        
        return {
            "message": "Police notifications fetched successfully",
            "unread_count": unread_count,
            "total_count": len(notifications),
            "notifications": notifications
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


@router.put("/police/{notif_id}/read")
async def mark_police_notification_read(notif_id: int):
    """Mark a police notification as read."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE NOTIFICATIONS SET is_read = TRUE WHERE notif_id = %s",
            (notif_id,)
        )
        conn.commit()
        
        return {"message": "Notification marked as read", "notif_id": notif_id}
        
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
