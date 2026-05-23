"""
Traffic Violation Management System — Rules Management Routes
Self-contained with pymysql, for police to manage violation rules
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import pymysql
from datetime import datetime

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


class RuleUpdateRequest(BaseModel):
    rule_name: Optional[str] = None
    description: Optional[str] = None
    base_fine_amount: Optional[float] = None
    severity: Optional[str] = None  # 'Minor', 'Moderate', 'Major', 'Critical'
    violation_time: Optional[str] = None  # 'Daytime', 'Nighttime', 'Anytime'
    is_active: Optional[bool] = None


class RuleCreateRequest(BaseModel):
    rule_code: str
    rule_name: str
    description: str
    base_fine_amount: float
    severity: str = 'Minor'
    violation_time: str = 'Anytime'
    is_active: bool = True


@router.get("/all")
async def get_all_rules():
    """Get all violation rules (for citizens' Rules & Laws page)."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """SELECT rule_id, rule_code, rule_name, description, 
                      base_fine_amount, severity, violation_time, 
                      is_active, created_at
               FROM VIOLATION_RULES
               ORDER BY rule_code ASC"""
        )
        
        rules = cursor.fetchall()
        
        # Convert Decimal to float and datetime to string
        for rule in rules:
            if rule.get('base_fine_amount'):
                rule['base_fine_amount'] = float(rule['base_fine_amount'])
            if rule.get('created_at'):
                rule['created_at'] = rule['created_at'].isoformat()
        
        return {
            "message": "Violation rules fetched successfully",
            "count": len(rules),
            "rules": rules
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


@router.get("/{rule_id}")
async def get_rule(rule_id: int):
    """Get a specific violation rule by ID."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """SELECT rule_id, rule_code, rule_name, description, 
                      base_fine_amount, severity, violation_time, 
                      is_active, created_at
               FROM VIOLATION_RULES
               WHERE rule_id = %s""",
            (rule_id,)
        )
        
        rule = cursor.fetchone()
        
        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rule {rule_id} not found"
            )
        
        # Convert Decimal to float and datetime to string
        if rule.get('base_fine_amount'):
            rule['base_fine_amount'] = float(rule['base_fine_amount'])
        if rule.get('created_at'):
            rule['created_at'] = rule['created_at'].isoformat()
        
        return {
            "message": "Rule fetched successfully",
            "rule": rule
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


@router.put("/{rule_id}")
async def update_rule(rule_id: int, update_data: RuleUpdateRequest):
    """Police officer updates a violation rule (fine amount, severity, etc.)."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if rule exists
        cursor.execute(
            "SELECT rule_id FROM VIOLATION_RULES WHERE rule_id = %s",
            (rule_id,)
        )
        rule = cursor.fetchone()
        
        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rule {rule_id} not found"
            )
        
        # Build dynamic update query
        update_fields = []
        update_values = []
        
        if update_data.rule_name is not None:
            update_fields.append("rule_name = %s")
            update_values.append(update_data.rule_name)
        
        if update_data.description is not None:
            update_fields.append("description = %s")
            update_values.append(update_data.description)
        
        if update_data.base_fine_amount is not None:
            update_fields.append("base_fine_amount = %s")
            update_values.append(update_data.base_fine_amount)
        
        if update_data.severity is not None:
            if update_data.severity not in ['Minor', 'Moderate', 'Major', 'Critical']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Severity must be 'Minor', 'Moderate', 'Major', or 'Critical'"
                )
            update_fields.append("severity = %s")
            update_values.append(update_data.severity)
        
        if update_data.violation_time is not None:
            if update_data.violation_time not in ['Daytime', 'Nighttime', 'Anytime']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Violation time must be 'Daytime', 'Nighttime', or 'Anytime'"
                )
            update_fields.append("violation_time = %s")
            update_values.append(update_data.violation_time)
        
        if update_data.is_active is not None:
            update_fields.append("is_active = %s")
            update_values.append(1 if update_data.is_active else 0)
        
        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        update_values.append(rule_id)
        
        query = f"UPDATE VIOLATION_RULES SET {', '.join(update_fields)} WHERE rule_id = %s"
        cursor.execute(query, update_values)
        
        conn.commit()
        
        return {
            "message": f"Rule {rule_id} updated successfully",
            "rule_id": rule_id
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


@router.post("/create")
async def create_rule(rule_data: RuleCreateRequest):
    """Police officer creates a new violation rule."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Validate severity
        if rule_data.severity not in ['Minor', 'Moderate', 'Major', 'Critical']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Severity must be 'Minor', 'Moderate', 'Major', or 'Critical'"
            )
        
        # Validate violation_time
        if rule_data.violation_time not in ['Daytime', 'Nighttime', 'Anytime']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Violation time must be 'Daytime', 'Nighttime', or 'Anytime'"
            )
        
        # Check if rule_code already exists
        cursor.execute(
            "SELECT rule_id FROM VIOLATION_RULES WHERE rule_code = %s",
            (rule_data.rule_code,)
        )
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Rule code '{rule_data.rule_code}' already exists"
            )
        
        # Insert new rule
        cursor.execute(
            """INSERT INTO VIOLATION_RULES 
               (rule_code, rule_name, description, base_fine_amount, severity, violation_time, is_active)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (
                rule_data.rule_code,
                rule_data.rule_name,
                rule_data.description,
                rule_data.base_fine_amount,
                rule_data.severity,
                rule_data.violation_time,
                1 if rule_data.is_active else 0
            )
        )
        
        conn.commit()
        
        return {
            "message": "Rule created successfully",
            "rule_code": rule_data.rule_code
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


@router.delete("/{rule_id}")
async def delete_rule(rule_id: int):
    """Police officer deletes a violation rule."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if rule exists
        cursor.execute(
            "SELECT rule_id, rule_code FROM VIOLATION_RULES WHERE rule_id = %s",
            (rule_id,)
        )
        rule = cursor.fetchone()
        
        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rule {rule_id} not found"
            )
        
        # Delete rule
        cursor.execute(
            "DELETE FROM VIOLATION_RULES WHERE rule_id = %s",
            (rule_id,)
        )
        
        conn.commit()
        
        return {
            "message": "Rule deleted successfully",
            "rule_id": rule_id,
            "rule_code": rule['rule_code']
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
