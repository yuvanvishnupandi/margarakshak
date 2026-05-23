"""
Traffic Violation Management System — Rewards & Wallet Routes
Handles reward point to wallet balance conversion
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

# Conversion rate: 10 points = Rs. 50
POINTS_PER_REDEMPTION = 10
WALLET_AMOUNT_PER_REDEMPTION = 50.00


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


class RedeemRequest(BaseModel):
    citizen_id: int
    points_to_redeem: int


@router.post("/redeem")
async def redeem_points(request: RedeemRequest):
    """
    Convert reward points to wallet balance.
    Conversion Rate: 10 points = Rs. 50
    """
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Validate points (must be positive and multiple of 10)
        if request.points_to_redeem <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Points to redeem must be greater than 0"
            )
        
        if request.points_to_redeem % POINTS_PER_REDEMPTION != 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Points must be in multiples of {POINTS_PER_REDEMPTION}"
            )
        
        # Check citizen has sufficient points
        cursor.execute(
            "SELECT citizen_id, reward_points, wallet_balance FROM CITIZENS WHERE citizen_id = %s",
            (request.citizen_id,)
        )
        citizen = cursor.fetchone()
        
        if not citizen:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Citizen not found"
            )
        
        if citizen['reward_points'] < request.points_to_redeem:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient points. You have {citizen['reward_points']} points, trying to redeem {request.points_to_redeem}"
            )
        
        # Calculate wallet amount
        wallet_amount = (request.points_to_redeem / POINTS_PER_REDEMPTION) * WALLET_AMOUNT_PER_REDEMPTION
        
        # Start transaction
        conn.begin()
        
        # Update citizen: decrement points, increment wallet
        cursor.execute(
            """UPDATE CITIZENS 
               SET reward_points = reward_points - %s,
                   wallet_balance = wallet_balance + %s
               WHERE citizen_id = %s""",
            (request.points_to_redeem, wallet_amount, request.citizen_id)
        )
        
        # Log redemption in history
        cursor.execute(
            """INSERT INTO REDEMPTION_HISTORY (citizen_id, points_redeemed, wallet_amount, conversion_rate)
               VALUES (%s, %s, %s, %s)""",
            (request.citizen_id, request.points_to_redeem, wallet_amount, 
             f"{POINTS_PER_REDEMPTION} points = Rs. {WALLET_AMOUNT_PER_REDEMPTION:.0f}")
        )
        
        conn.commit()
        
        # Fetch updated balances
        cursor.execute(
            "SELECT reward_points, wallet_balance FROM CITIZENS WHERE citizen_id = %s",
            (request.citizen_id,)
        )
        updated = cursor.fetchone()
        
        return {
            "message": f"Successfully redeemed {request.points_to_redeem} points to Rs. {wallet_amount:.2f}",
            "points_redeemed": request.points_to_redeem,
            "wallet_amount_added": wallet_amount,
            "new_reward_points": updated['reward_points'],
            "new_wallet_balance": updated['wallet_balance']
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


@router.get("/wallet/{citizen_id}")
async def get_wallet_info(citizen_id: int):
    """Get citizen's wallet balance, reward points, and redemption history."""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current balances
        cursor.execute(
            """SELECT citizen_id, reward_points, wallet_balance, trust_score
               FROM CITIZENS WHERE citizen_id = %s""",
            (citizen_id,)
        )
        citizen = cursor.fetchone()
        
        if not citizen:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Citizen not found"
            )
        
        # Get redemption history (last 20 transactions)
        cursor.execute(
            """SELECT redemption_id, points_redeemed, wallet_amount, 
                      conversion_rate, redeemed_at
               FROM REDEMPTION_HISTORY
               WHERE citizen_id = %s
               ORDER BY redeemed_at DESC
               LIMIT 20""",
            (citizen_id,)
        )
        history = cursor.fetchall()
        
        # Convert datetime to string
        for record in history:
            if record.get('redeemed_at'):
                record['redeemed_at'] = record['redeemed_at'].isoformat()
        
        return {
            "citizen_id": citizen['citizen_id'],
            "reward_points": citizen['reward_points'],
            "wallet_balance": float(citizen['wallet_balance']),
            "trust_score": citizen['trust_score'],
            "conversion_rate": f"{POINTS_PER_REDEMPTION} points = Rs. {WALLET_AMOUNT_PER_REDEMPTION:.0f}",
            "redemption_history": history
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
