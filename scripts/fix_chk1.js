/**
 * fix_chk1.js
 * Fixes the citizens_chk_1 check constraint violation.
 *
 * Root cause: Auto_Reward_System trigger does trust_score + 10 with NO cap.
 * When reporter already has trust_score = 200 (the CHECK max), adding 10
 * pushes it to 210 → violates citizens_chk_1.
 *
 * Fix:
 *   1. Drop all broken REPORTS triggers
 *   2. Recreate with LEAST(trust_score+10, 200) cap
 *   3. Clamp any existing rows that already exceeded 200
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'traffic_violation',
  multipleStatements: true,
});

async function run() {
  const conn = await pool.getConnection();
  console.log('✅ Connected to MySQL\n');

  try {
    // ── Step 1: Drop broken triggers ──────────────────────────────────────
    const dropTriggers = [
      'DROP TRIGGER IF EXISTS Auto_Reward_System',
      'DROP TRIGGER IF EXISTS Auto_Penalty_System',
      'DROP TRIGGER IF EXISTS trg_report_status_trust',
      'DROP TRIGGER IF EXISTS after_report_status_change',
    ];
    for (const sql of dropTriggers) {
      await conn.query(sql);
      console.log(`  Dropped: ${sql.split(' ').slice(-1)[0]}`);
    }
    console.log('✅ Step 1: Old triggers dropped\n');

    // ── Step 2: Recreate Auto_Reward_System with LEAST(+10, 200) cap ──────
    await conn.query(`
      CREATE TRIGGER Auto_Reward_System
      AFTER UPDATE ON REPORTS
      FOR EACH ROW
      BEGIN
        IF OLD.status = 'Pending' AND NEW.status = 'Verified' THEN
          UPDATE CITIZENS
          SET
            trust_score       = LEAST(trust_score + 10, 200),
            reward_points     = reward_points + 10,
            reports_submitted = reports_submitted + 1
          WHERE citizen_id = NEW.citizen_id;
        END IF;
      END
    `);
    console.log('✅ Step 2: Auto_Reward_System trigger recreated (capped at 200)\n');

    // ── Step 3: Recreate Auto_Penalty_System with GREATEST(-10, 0) floor ──
    await conn.query(`
      CREATE TRIGGER Auto_Penalty_System
      AFTER UPDATE ON REPORTS
      FOR EACH ROW
      BEGIN
        IF OLD.status = 'Pending' AND NEW.status = 'Rejected' THEN
          UPDATE CITIZENS
          SET
            trust_score       = GREATEST(trust_score - 10, 0),
            reports_submitted = reports_submitted + 1
          WHERE citizen_id = NEW.citizen_id;
        END IF;
      END
    `);
    console.log('✅ Step 3: Auto_Penalty_System trigger recreated (floor at 0)\n');

    // ── Step 4: Clamp existing rows already over 200 ──────────────────────
    const [clampResult] = await conn.query(
      `UPDATE CITIZENS SET trust_score = 200 WHERE trust_score > 200`
    );
    console.log(`✅ Step 4: Clamped ${clampResult.affectedRows} citizen row(s) that exceeded 200\n`);

    // ── Step 5: Show all citizen scores ───────────────────────────────────
    const [citizens] = await conn.query(
      `SELECT citizen_id, full_name, trust_score, reward_points, account_status FROM CITIZENS ORDER BY citizen_id`
    );
    console.log('📊 Current citizen trust scores:');
    console.table(citizens);

    // ── Step 6: Show active triggers on REPORTS ───────────────────────────
    const [triggers] = await conn.query(`
      SELECT TRIGGER_NAME, EVENT_MANIPULATION, ACTION_TIMING
      FROM INFORMATION_SCHEMA.TRIGGERS
      WHERE TRIGGER_SCHEMA = DATABASE()
        AND EVENT_OBJECT_TABLE = 'REPORTS'
      ORDER BY TRIGGER_NAME
    `);
    console.log('🔧 Active triggers on REPORTS table:');
    console.table(triggers);

    console.log('\n🎉 ALL DONE — Retry issuing the challan now! The error is fixed.');

  } catch (err) {
    console.error('\n❌ Error during fix:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
