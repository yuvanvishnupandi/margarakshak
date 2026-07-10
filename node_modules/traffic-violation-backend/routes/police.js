const express = require('express');
const db = require('../db');
const { authenticateToken, requirePolice } = require('../middleware/auth');

const router = express.Router();

router.get('/pending', authenticateToken, requirePolice, async (req, res) => {
  try {
    let rows;
    try {
      // Try the VIEW first
      [rows] = await db.execute('SELECT * FROM Pending_Reports_Dashboard');
    } catch (viewErr) {
      // VIEW doesn't exist on this DB — fall back to direct query
      [rows] = await db.execute(`
        SELECT 
          r.report_id, r.plate_no, r.violation_type, r.status,
          r.location_address, r.description, r.evidence_path,
          r.date_reported, r.district,
          c.full_name AS citizen_name, c.phone AS citizen_phone,
          c.trust_score
        FROM REPORTS r
        JOIN CITIZENS c ON r.citizen_id = c.citizen_id
        WHERE r.status = 'Pending'
        ORDER BY r.date_reported DESC
      `);
    }
    res.json(rows);
  } catch (err) {
    console.error('Fetch pending reports error:', err);
    res.status(500).json({ error: 'Failed to fetch pending reports: ' + err.message });
  }
});

router.patch('/verify/:id', authenticateToken, requirePolice, async (req, res) => {
  const report_id = req.params.id;
  const badge_no = req.user.id;
  const { rule_id } = req.body;

  if (!rule_id) {
    return res.status(400).json({ error: 'rule_id is required to issue challan.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [reportRows] = await connection.execute(
      `SELECT citizen_id, plate_no FROM REPORTS WHERE report_id = ? AND status = 'Pending' FOR UPDATE`,
      [report_id]
    );

    if (reportRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Report not found or already processed.' });
    }

    const { citizen_id, plate_no } = reportRows[0];

    const [ruleRows] = await connection.execute(
      `SELECT base_fine_amount, rule_name FROM VIOLATION_RULES WHERE rule_id = ? AND is_active = TRUE`,
      [rule_id]
    );

    if (ruleRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: 'Invalid or inactive violation rule.' });
    }

    const [updateResult] = await connection.execute(
      `UPDATE REPORTS SET status = 'Verified', reviewed_by = ?, reviewed_at = NOW() WHERE report_id = ?`,
      [badge_no, report_id]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Report not found or already processed.' });
    }

    const [eventResult] = await connection.execute(
      `INSERT INTO VIOLATION_EVENTS (report_id, rule_id, plate_no, notes) VALUES (?, ?, ?, CONCAT('Violation: ', ?))`,
      [report_id, rule_id, plate_no, ruleRows[0].rule_name]
    );
    const event_id = eventResult.insertId;

    const [challanResult] = await connection.execute(
      `INSERT INTO CHALLANS (event_id, citizen_id, badge_no, total_amount, issue_date, due_date) VALUES (?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY))`,
      [event_id, citizen_id, badge_no, ruleRows[0].base_fine_amount]
    );

    await connection.commit();
    connection.release();

    res.json({ 
      message: 'Report verified and challan issued successfully.',
      challan_id: challanResult.insertId,
      amount: ruleRows[0].base_fine_amount
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Verify report error:', err);
    res.status(500).json({ error: 'Failed to verify report.' });
  }
});

router.patch('/reject/:id', authenticateToken, requirePolice, async (req, res) => {
  const report_id = req.params.id;

  try {
    const [result] = await db.execute(
      `UPDATE REPORTS SET status = 'Rejected' WHERE report_id = ? AND status = 'Pending'`,
      [report_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Report not found or already processed.' });
    }

    res.json({ message: 'Report rejected successfully.' });
  } catch (err) {
    console.error('Reject report error:', err);
    res.status(500).json({ error: 'Failed to reject report.' });
  }
});

router.get('/officer-performance', async (req, res) => {
  try {
    let rows;
    try {
      [rows] = await db.execute('SELECT * FROM Officer_Performance_View ORDER BY verified_count DESC LIMIT 5');
    } catch (viewErr) {
      [rows] = await db.execute(`
        SELECT badge_no, COUNT(*) as verified_count 
        FROM REPORTS WHERE status='Verified' AND reviewed_by IS NOT NULL
        GROUP BY reviewed_by ORDER BY verified_count DESC LIMIT 5
      `);
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Officer performance error:', err);
    res.status(500).json({ success: false, data: [], error: 'Officer performance unavailable' });
  }
});

module.exports = router;
