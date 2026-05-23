"""
Traffic Violation Management System — Configuration
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "traffic_violation_db"
    DB_POOL_SIZE: int = 10

    # ── JWT ────────────────────────────────────────────────────────────
    JWT_SECRET: str = "tvms-super-secret-key-change-in-production-2025"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 8

    # ── Server ─────────────────────────────────────────────────────────
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 5000
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    UPLOAD_DIR: str = os.path.join(os.path.dirname(__file__), "uploads")

    # ── Face Recognition ───────────────────────────────────────────────
    FACE_TOLERANCE: float = 0.5
    FACE_MODEL: str = "hog"  # 'hog' for CPU, 'cnn' for GPU

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
