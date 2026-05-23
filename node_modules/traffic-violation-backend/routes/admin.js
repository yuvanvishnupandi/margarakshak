const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/admin/overdue-log
router.get('/overdue-log', async (req, res) => {
  try {
    // Primary: records in OVERDUE_LOG joined through CHALLANS → CITIZENS
    let rows = [];
    try {
      [rows] = await db.execute(
        `SELECT ol.log_id, ol.challan_id, ol.flagged_at,
                COALESCE(ol.penalty_amount, 0) AS penalty_amount,
                COALESCE(ol.original_amount, ch.total_amount) AS original_amount,
                ch.payment_status, ch.total_amount AS current_amount, ch.due_date,
                c.citizen_id, c.full_name AS citizen_name,
                c.email AS citizen_email, c.phone_no
         FROM OVERDUE_LOG ol
         JOIN CHALLANS ch ON ol.challan_id = ch.challan_id
         JOIN CITIZENS c ON ch.citizen_id = c.citizen_id
         WHERE ch.payment_status IN ('Unpaid','Overdue','Disputed')
         ORDER BY ol.flagged_at DESC`
      );
    } catch (joinErr) {
      console.warn('OVERDUE_LOG join failed, trying simpler query:', joinErr.message);
    }

    // Fallback / supplement: also fetch any challan past due_date not yet in OVERDUE_LOG
    const [pastDue] = await db.execute(
      `SELECT NULL AS log_id, ch.challan_id, NOW() AS flagged_at,
              ROUND(ch.total_amount * 0.15, 2) AS penalty_amount,
              ch.total_amount AS original_amount,
              ch.payment_status, ch.total_amount AS current_amount, ch.due_date,
              c.citizen_id, c.full_name AS citizen_name,
              c.email AS citizen_email, c.phone_no
       FROM CHALLANS ch
       JOIN CITIZENS c ON ch.citizen_id = c.citizen_id
       WHERE ch.payment_status IN ('Unpaid','Overdue')
         AND ch.due_date < CURDATE()
         AND ch.challan_id NOT IN (
           SELECT challan_id FROM OVERDUE_LOG
         )
       ORDER BY ch.due_date ASC`
    );

    // Merge: OVERDUE_LOG entries first, then any extra past-due challans
    const merged = [...rows, ...pastDue];

    // Deduplicate by challan_id (keep OVERDUE_LOG version if duplicate)
    const seen = new Set();
    const final = merged.filter(r => {
      if (seen.has(r.challan_id)) return false;
      seen.add(r.challan_id);
      return true;
    });

    res.json({ overdue_log: final, count: final.length });
  } catch (err) {
    console.error('Overdue log error:', err);
    res.status(500).json({ error: 'Failed to fetch overdue log: ' + err.message, overdue_log: [] });
  }
});


// POST /api/admin/flag-overdue  — manually trigger the stored procedure
router.post('/flag-overdue', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.execute('CALL sp_flag_overdue_challans(@flagged)');
    const [[result]] = await conn.execute('SELECT @flagged AS flagged_count');
    conn.release();
    res.json({
      message: 'Overdue check complete.',
      flagged_count: result.flagged_count || 0
    });
  } catch (err) {
    if (conn) conn.release();
    console.error('Flag overdue error:', err);
    res.status(500).json({ error: 'Failed to flag overdue: ' + err.message });
  }
});

// GET /api/admin/active-sessions
router.get('/active-sessions', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT session_id, user_id, user_role, ip_address,
              created_at, expires_at, is_active
       FROM ACTIVE_SESSIONS
       WHERE is_active = 1 AND expires_at > NOW()
       ORDER BY created_at DESC`
    );
    res.json({ sessions: rows, count: rows.length });
  } catch (err) {
    console.error('Active sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions: ' + err.message });
  }
});

// GET /api/admin/officer-stats  — from Officer_Performance_View
router.get('/officer-stats', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT badge_no, full_name, station_code,
              verified_count, rejected_count, challans_issued, revenue_collected
       FROM Officer_Performance_View
       ORDER BY challans_issued DESC`
    );
    res.json({ officers: rows, count: rows.length });
  } catch (err) {
    console.error('Officer stats error:', err);
    res.status(500).json({ error: 'Failed to fetch officer stats: ' + err.message });
  }
});

// GET /api/admin/habitual-offenders
router.get('/habitual-offenders', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT v.plate_no, v.vehicle_model, v.vehicle_type, v.owner_name,
              COUNT(ve.event_id) AS violation_count,
              SUM(ch.total_amount) AS total_fines,
              SUM(CASE WHEN ch.payment_status='Unpaid' THEN ch.total_amount ELSE 0 END) AS unpaid_amount
       FROM VEHICLES v
       JOIN VIOLATION_EVENTS ve ON v.plate_no = ve.plate_no
       LEFT JOIN CHALLANS ch ON ve.event_id = ch.event_id
       GROUP BY v.plate_no, v.vehicle_model, v.vehicle_type, v.owner_name
       HAVING violation_count >= 2
       ORDER BY violation_count DESC`
    );
    res.json({ habitual_offenders: rows, count: rows.length });
  } catch (err) {
    console.error('Habitual offenders error:', err);
    res.status(500).json({ error: 'Failed: ' + err.message });
  }
});

module.exports = router;
