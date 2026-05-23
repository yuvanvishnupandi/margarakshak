const express = require('express');
const db = require('../db');
const router = express.Router();

// ── Notification helper (exact schema: notif_id, notif_type, citizen_id, message, is_read) ──
const notify = async (citizen_id, notif_type, message) => {
  try {
    await db.execute(
      `INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message, is_read) VALUES (?,?,?,0)`,
      [citizen_id, notif_type, message]
    );
  } catch (e) { /* silent */ }
};

// GET /api/appeals/police/pending
router.get('/police/pending', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT a.appeal_id, a.challan_id, a.citizen_id, a.reason,
              a.status, a.created_at, a.review_notes,
              c.total_amount, c.payment_status, c.issue_date,
              cit.full_name AS citizen_name, cit.email AS citizen_email,
              vr.rule_name, vr.rule_code,
              ve.plate_no,
              r.description AS violation_description
       FROM APPEALS a
       JOIN CHALLANS c ON a.challan_id = c.challan_id
       JOIN VIOLATION_EVENTS ve ON c.event_id = ve.event_id
       JOIN VIOLATION_RULES vr ON ve.rule_id = vr.rule_id
       JOIN CITIZENS cit ON a.citizen_id = cit.citizen_id
       JOIN REPORTS r ON ve.report_id = r.report_id
       WHERE a.status IN ('Pending','Under Review')
       ORDER BY a.created_at DESC`
    );
    res.json({ success: true, appeals: rows, count: rows.length });
  } catch (err) {
    console.error('Pending appeals error:', err);
    try {
      const [rows2] = await db.execute(
        `SELECT appeal_id, challan_id, citizen_id, reason, status, created_at
         FROM APPEALS WHERE status IN ('Pending','Under Review') ORDER BY created_at DESC`
      );
      res.json({ success: true, appeals: rows2, count: rows2.length });
    } catch (e) {
      res.status(500).json({ success: false, appeals: [], error: e.message });
    }
  }
});

// PUT /api/appeals/:id/review  — police decision
router.put('/:id/review', async (req, res) => {
  const { id } = req.params;
  const { status, review_notes, badge_no, police_remarks } = req.body;
  const notes = review_notes || police_remarks || null;
  if (!['Accepted', 'Rejected'].includes(status))
    return res.status(400).json({ error: "Status must be 'Accepted' or 'Rejected'." });
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const [[appeal]] = await conn.execute(
      `SELECT appeal_id, challan_id, citizen_id, status FROM APPEALS WHERE appeal_id=?`, [id]
    );
    if (!appeal) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Appeal not found.' }); }

    await conn.execute(
      `UPDATE APPEALS SET status=?, reviewed_at=NOW(), review_notes=?, reviewed_by=? WHERE appeal_id=?`,
      [status, notes, badge_no || null, id]
    );

    if (status === 'Accepted') {
      await conn.execute(`UPDATE CHALLANS SET payment_status='Waived' WHERE challan_id=?`, [appeal.challan_id]);
    } else {
      await conn.execute(`UPDATE CHALLANS SET payment_status='Unpaid' WHERE challan_id=?`, [appeal.challan_id]);
    }

    await conn.commit();
    conn.release();

    // 🔔 Notify citizen of appeal decision
    if (status === 'Accepted') {
      await notify(appeal.citizen_id, 'Appeal Status',
        `Great news! Your appeal #${id} for Challan #${appeal.challan_id} has been ACCEPTED. The challan has been waived.`
      );
    } else {
      await notify(appeal.citizen_id, 'Appeal Status',
        `Your appeal #${id} for Challan #${appeal.challan_id} has been REJECTED. Please pay the challan amount. Reason: ${notes || 'No reason provided'}.`
      );
    }

    res.json({ message: `Appeal ${status.toLowerCase()} successfully.`, appeal_id: id });
  } catch (err) {
    if (conn) { await conn.rollback(); conn.release(); }
    console.error('Review appeal error:', err);
    res.status(500).json({ error: 'Failed to review appeal: ' + err.message });
  }
});

// POST /api/appeals/submit  — citizen submits appeal
router.post('/submit', async (req, res) => {
  const { challan_id, citizen_id, reason } = req.body;
  if (!challan_id || !citizen_id || !reason)
    return res.status(400).json({ error: 'challan_id, citizen_id, reason required.' });
  if (reason.trim().length < 10)
    return res.status(400).json({ error: 'Appeal reason must be at least 10 characters.' });
  try {
    const [[exist]] = await db.execute(
      `SELECT appeal_id FROM APPEALS WHERE challan_id=? AND status IN ('Pending','Under Review')`, [challan_id]
    );
    if (exist) return res.status(409).json({ error: 'This challan already has a pending appeal.' });
    const [result] = await db.execute(
      `INSERT INTO APPEALS (challan_id, citizen_id, reason, status) VALUES (?,?,?,'Pending')`,
      [challan_id, citizen_id, reason.trim()]
    );
    await db.execute(`UPDATE CHALLANS SET payment_status='Disputed' WHERE challan_id=?`, [challan_id]);

    // 🔔 Notify citizen: appeal submitted
    await notify(citizen_id, 'Appeal Status',
      `Your appeal for Challan #${challan_id} has been submitted and is pending police review.`
    );

    res.status(201).json({ message: 'Appeal submitted successfully.', appeal_id: result.insertId });
  } catch (err) {
    console.error('Submit appeal error:', err);
    res.status(500).json({ error: 'Failed to submit appeal: ' + err.message });
  }
});

module.exports = router;
