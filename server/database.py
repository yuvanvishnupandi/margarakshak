"""
Traffic Violation Management System — MySQL Connection Pool
"""
import mysql.connector
from mysql.connector import pooling, Error as MySQLError
from contextlib import contextmanager
from config import get_settings
import logging

logger = logging.getLogger("tvms.database")

_pool: pooling.MySQLConnectionPool | None = None

def init_pool() -> pooling.MySQLConnectionPool:
    """Initialise the MySQL connection pool (called once at startup)."""
    global _pool
    if _pool is not None:
        return _pool

    # HARDCODED DATABASE CONNECTION - FORCED
    try:
        _pool = pooling.MySQLConnectionPool(
            pool_name="tvms_pool",
            pool_size=10,
            pool_reset_session=True,
            host='localhost',
            port=3306,
            user='root',
            password='yvpandi@11',
            database='traffic_violation_db',
            charset="utf8mb4",
            collation="utf8mb4_unicode_ci",
            autocommit=False,
            connection_timeout=10,
        )
        logger.info(
            "MySQL pool '%s' created (10 connections) → root@localhost/traffic_violation_db [HARDCODED]",
            _pool.pool_name,
        )
        return _pool
    except MySQLError as e:
        logger.error("Failed to create MySQL pool: %s", e)
        raise

def get_pool() -> pooling.MySQLConnectionPool:
    """Return the existing pool or create it lazily."""
    global _pool
    if _pool is None:
        return init_pool()
    return _pool

@contextmanager
def get_connection():
    """Context-managed connection from the pool."""
    conn = None
    try:
        conn = get_pool().get_connection()
        yield conn
    except MySQLError as e:
        if conn and conn.is_connected():
            conn.rollback()
        logger.error("DB error: %s", e)
        raise
    finally:
        if conn and conn.is_connected():
            conn.close()

@contextmanager
def get_cursor(dictionary: bool = True, buffered: bool = True):
    """Context-managed cursor (auto-commit on exit)."""
    with get_connection() as conn:
        cur = conn.cursor(dictionary=dictionary, buffered=buffered)
        try:
            yield cur, conn
        finally:
            cur.close()