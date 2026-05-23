/**
 * fix_chk1_v2.js — Final fix for citizens_chk_1 + reports_submitted errors
 *
 * Problems fixed:
 *  1. Auto_Reward_System had no LEAST() cap → trust_score > 200 violated citizens_chk_1
 *  2. Auto_Reward_System & Auto_Penalty_System both referenced `reports_submitted`
 *     which does NOT exist in the CITIZENS table → ER 1054
 *
 * Solution:
 *  - Drop all broken triggers
 *  - Recreate with LEAST/GREATEST guards, NO reports_submitted reference
 *  - Clamp any existing rows already over 200
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'traffic_violation',
  multipleStatements: false,
});

async function run() {
  const conn = await pool.getConnection();
  console.log('✅ Connected to MySQL\n');

  try {
    // ── Step 1: Drop ALL broken triggers on REPORTS ───────────────────────
    const dropTriggers = [
      'DROP TRIGGER IF EXISTS Auto_Reward_System',
      'DROP TRIGGER IF EXISTS Auto_Penalty_System',
      'DROP TRIGGER IF EXISTS trg_report_status_trust',
      'DROP TRIGGER IF EXISTS after_report_status_change',
    ];
    for (const sql of dropTriggers) {
      await conn.query(sql);
      console.log(`  Dropped: ${sql.split(' ').pop()}`);
    }
    console.log('✅ Step 1: Old triggers dropped\n');

    // ── Step 2: Recreate Auto_Reward_System ──────────────────────────────
    // - trust_score capped at 200 with LEAST()
    // - reward_points incremented (column EXISTS)
    // - NO reports_submitted (column does NOT exist)
    await conn.query(`
      CREATE TRIGGER Auto_Reward_System
      AFTER UPDATE ON REPORTS
      FOR EACH ROW
      BEGIN
        IF OLD.status = 'Pending' AND NEW.status = 'Verified' THEN
          UPDATE CITIZENS
          SET
            trust_score   = LEAST(trust_score + 10, 200),
            reward_points = reward_points + 10
          WHERE citizen_id = NEW.citizen_id;
        END IF;
      END
    `);
    console.log('✅ Step 2: Auto_Reward_System recreated (capped at 200, no reports_submitted)\n');

    // ── Step 3: Recreate Auto_Penalty_System ─────────────────────────────
    // - trust_score floored at 0 with GREATEST()
    // - NO reports_submitted (column does NOT exist)
    await conn.query(`
      CREATE TRIGGER Auto_Penalty_System
      AFTER UPDATE ON REPORTS
      FOR EACH ROW
      BEGIN
        IF OLD.status = 'Pending' AND NEW.status = 'Rejected' THEN
          UPDATE CITIZENS
          SET trust_score = GREATEST(trust_score - 10, 0)
          WHERE citizen_id = NEW.citizen_id;
        END IF;
      END
    `);
    console.log('✅ Step 3: Auto_Penalty_System recreated (floor at 0, no reports_submitted)\n');

    // ── Step 4: Clamp any existing over-limit rows ────────────────────────
    const [clamp] = await conn.query(
      'UPDATE CITIZENS SET trust_score = 200 WHERE trust_score > 200'
    );
    console.log(`✅ Step 4: Clamped ${clamp.affectedRows} row(s) that exceeded trust_score=200\n`);

    // ── Step 5: Show citizen trust scores ─────────────────────────────────
    const [citizens] = await conn.query(
      'SELECT citizen_id, full_name, trust_score, reward_points, account_status FROM CITIZENS ORDER BY citizen_id'
    );
    console.log('📊 Citizen trust scores after fix:');
    console.table(citizens);

    // ── Step 6: Verify active triggers on REPORTS ─────────────────────────
    const [triggers] = await conn.query(`
      SELECT TRIGGER_NAME, EVENT_MANIPULATION, ACTION_TIMING
      FROM INFORMATION_SCHEMA.TRIGGERS
      WHERE TRIGGER_SCHEMA = DATABASE()
        AND EVENT_OBJECT_TABLE = 'REPORTS'
      ORDER BY TRIGGER_NAME
    `);
    console.log('🔧 Active triggers on REPORTS:');
    console.table(triggers);

    console.log('\n🎉 ALL DONE — Issue the challan now, no more errors!');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
