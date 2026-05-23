const db = require('../backend/db');

async function setupTemporalDB() {
  try {
    console.log("Setting up Temporal Database (Audit History) for REPORTS...");
    
    // 1. Create the Temporal History Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS REPORTS_HISTORY (
        history_id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL,
        old_status ENUM('Pending', 'Verified', 'Rejected') NULL,
        new_status ENUM('Pending', 'Verified', 'Rejected') NOT NULL,
        changed_by VARCHAR(50) NULL,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        version_snapshot INT NOT NULL,
        action_type VARCHAR(50) DEFAULT 'UPDATE'
      );
    `);
    console.log("✓ REPORTS_HISTORY temporal table created.");

    // 3. Create the Trigger (use query instead of execute for DDL)
    await db.query(`
      CREATE TRIGGER temporal_report_update
      AFTER UPDATE ON REPORTS
      FOR EACH ROW
      BEGIN
        IF OLD.status != NEW.status OR OLD.version != NEW.version THEN
          INSERT INTO REPORTS_HISTORY 
          (report_id, old_status, new_status, changed_by, version_snapshot)
          VALUES 
          (NEW.report_id, OLD.status, NEW.status, NEW.reviewed_by, NEW.version);
        END IF;
      END;
    `);
    console.log("✓ Temporal Trigger 'temporal_report_update' created successfully.");
    
    console.log("Temporal Database Setup Complete. All report changes will now be permanently recorded in time.");
    process.exit(0);
  } catch (err) {
    console.error("Error setting up Temporal Database:", err);
    process.exit(1);
  }
}

setupTemporalDB();
