import mysql.connector
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("tvms.init_db")

# YOUR CONFIG
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "yvpandi@11"
}

def setup_database():
    """Create database and all required tables if they don't exist."""
    conn = None
    try:
        logger.info("--- Connecting to MySQL... ---")
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Create Database
        logger.info("Creating database 'traffic_violation_db'...")
        cursor.execute("CREATE DATABASE IF NOT EXISTS traffic_violation_db")
        cursor.execute("USE traffic_violation_db")
        logger.info("✅ Database ready")

        # Create Citizens Table
        logger.info("Creating CITIZENS table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS CITIZENS (
                citizen_id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone_no VARCHAR(15),
                password_hash VARCHAR(255) NOT NULL,
                dob DATE,
                trust_score INT DEFAULT 50,
                reward_points INT DEFAULT 0,
                account_status ENUM('Active', 'Suspended', 'Banned') DEFAULT 'Active',
                face_encoding LONGBLOB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_account_status (account_status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        logger.info("✅ CITIZENS table ready")

        # Create Police Officers Table
        logger.info("Creating POLICE_OFFICERS table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS POLICE_OFFICERS (
                badge_no VARCHAR(20) PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone_no VARCHAR(15),
                password_hash VARCHAR(255) NOT NULL,
                officer_rank VARCHAR(50) DEFAULT 'Constable',
                station_code VARCHAR(20) DEFAULT 'HQ001',
                is_active BOOLEAN DEFAULT TRUE,
                face_encoding LONGBLOB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        logger.info("✅ POLICE_OFFICERS table ready")

        # Create Reports Table
        logger.info("Creating REPORTS table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS REPORTS (
                report_id INT AUTO_INCREMENT PRIMARY KEY,
                citizen_id INT NOT NULL,
                plate_no VARCHAR(20) NOT NULL,
                violation_type VARCHAR(100) NOT NULL,
                location_coords POINT,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                location_address TEXT,
                description TEXT,
                evidence_path VARCHAR(255),
                status ENUM('Pending', 'Verified', 'Rejected', 'Challan Issued') DEFAULT 'Pending',
                fine_amount DECIMAL(10, 2) DEFAULT 0.00,
                date_reported TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_by VARCHAR(20),
                reviewed_at TIMESTAMP NULL,
                rejection_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (citizen_id) REFERENCES CITIZENS(citizen_id) ON DELETE CASCADE,
                FOREIGN KEY (reviewed_by) REFERENCES POLICE_OFFICERS(badge_no) ON DELETE SET NULL,
                INDEX idx_citizen_id (citizen_id),
                INDEX idx_status (status),
                INDEX idx_plate_no (plate_no),
                INDEX idx_date_reported (date_reported)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        logger.info("✅ REPORTS table ready")

        # Create VIOLATION_RULES Table
        logger.info("Creating VIOLATION_RULES table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS VIOLATION_RULES (
                rule_id INT AUTO_INCREMENT PRIMARY KEY,
                rule_code VARCHAR(20) UNIQUE NOT NULL,
                violation_name VARCHAR(100) NOT NULL,
                fine_amount DECIMAL(10, 2) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_rule_code (rule_code),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        logger.info("✅ VIOLATION_RULES table ready")

        # Create CHALLANS Table
        logger.info("Creating CHALLANS table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS CHALLANS (
                challan_id INT AUTO_INCREMENT PRIMARY KEY,
                report_id INT NOT NULL,
                plate_no VARCHAR(20) NOT NULL,
                violation_type VARCHAR(100) NOT NULL,
                fine_amount DECIMAL(10, 2) NOT NULL,
                issued_by VARCHAR(20) NOT NULL,
                issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status ENUM('Pending', 'Paid', 'Overdue') DEFAULT 'Pending',
                payment_date TIMESTAMP NULL,
                payment_method VARCHAR(50),
                due_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (report_id) REFERENCES REPORTS(report_id) ON DELETE CASCADE,
                FOREIGN KEY (issued_by) REFERENCES POLICE_OFFICERS(badge_no) ON DELETE CASCADE,
                INDEX idx_report_id (report_id),
                INDEX idx_plate_no (plate_no),
                INDEX idx_status (status),
                INDEX idx_issued_by (issued_by)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        logger.info("✅ CHALLANS table ready")

        conn.commit()
        
        logger.info("")
        logger.info("=" * 60)
        logger.info("✅ SUCCESS: Database and all tables are ready!")
        logger.info("=" * 60)
        logger.info("Tables created:")
        logger.info("  - CITIZENS")
        logger.info("  - POLICE_OFFICERS")
        logger.info("  - REPORTS")
        logger.info("  - VIOLATION_RULES")
        logger.info("  - CHALLANS")
        logger.info("=" * 60)
        
    except mysql.connector.Error as err:
        logger.error(f"\n❌ MYSQL ERROR: {err}")
        if conn:
            conn.rollback()
    except Exception as e:
        logger.error(f"\n❌ GENERAL ERROR: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
            logger.info("Database connection closed")

if __name__ == "__main__":
    setup_database()