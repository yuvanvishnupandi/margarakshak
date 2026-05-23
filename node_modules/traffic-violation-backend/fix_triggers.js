const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixTriggers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  try {
    await connection.query('DROP TRIGGER IF EXISTS Auto_Penalty_System;');
    await connection.query('DROP TRIGGER IF EXISTS Auto_Reward_System;');
    await connection.query('DROP TRIGGER IF EXISTS trg_report_status_trust;');
    
    // Recreate the master trigger with exact point distribution, NO notifications
    const createTrigger = `
      CREATE TRIGGER trg_report_status_trust
      AFTER UPDATE ON REPORTS
      FOR EACH ROW
      BEGIN
          DECLARE v_rejection_count INT DEFAULT 0;
          DECLARE v_total_rejections INT DEFAULT 0;
          DECLARE v_trust INT DEFAULT 0;
          
          IF OLD.status <> NEW.status THEN
              IF NEW.status = 'Verified' OR NEW.status = 'Challan Issued' THEN
                  UPDATE CITIZENS
                  SET trust_score = LEAST(trust_score + 10, 100),
                      reward_points = reward_points + 50,
                      consecutive_rejections = 0
                  WHERE citizen_id = NEW.citizen_id;
                  
              ELSEIF NEW.status = 'Rejected' THEN
                  SELECT consecutive_rejections, total_rejections
                  INTO v_rejection_count, v_total_rejections
                  FROM CITIZENS WHERE citizen_id = NEW.citizen_id;
                  
                  SET v_rejection_count = v_rejection_count + 1;
                  SET v_total_rejections = v_total_rejections + 1;
                  
                  UPDATE CITIZENS
                  SET trust_score = GREATEST(trust_score - 10, 0),
                      consecutive_rejections = v_rejection_count,
                      total_rejections = v_total_rejections
                  WHERE citizen_id = NEW.citizen_id;
                  
                  SELECT trust_score INTO v_trust FROM CITIZENS WHERE citizen_id = NEW.citizen_id;
                  
                  IF v_trust <= 0 THEN
                      UPDATE CITIZENS SET account_status = 'Suspended'
                      WHERE citizen_id = NEW.citizen_id AND account_status = 'Active';
                  END IF;
              END IF;
          END IF;
      END;
    `;
    await connection.query(createTrigger);
    console.log("Triggers fixed successfully.");
  } catch (err) {
    console.error("Error fixing triggers:", err);
  } finally {
    await connection.end();
  }
}

fixTriggers();
