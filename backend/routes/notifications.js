const express = require('express');
const db = require('../db');
const router_instance = express.Router();

const notify = async (citizen_id, notif_type, message) => {
  try {
    await db.execute(
      `INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message, is_read) VALUES (?,?,?,0)`,
      [citizen_id, notif_type, message]
    );
  } catch (err) {  }
};

router_instance.get('/police/all', async (req, res) => {
  try {
    const notifications = [];

    const [pendingReports] = await db.execute(
      `SELECT r.report_id, r.plate_no, r.violation_type, r.date_reported,
              c.full_name AS reporter_name
       FROM REPORTS r
       JOIN CITIZENS c ON r.citizen_id = c.citizen_id
       WHERE r.status = 'Pending'
       ORDER BY r.date_reported DESC LIMIT 20`
    ).catch(() => [[]]);

    for (const r of pendingReports) {
      notifications.push({
        notif_id: `rpt-${r.report_id}`,
        notif_type: 'New Report',
        message: `New report #${r.report_id}: ${r.violation_type} for vehicle ${r.plate_no} by ${r.reporter_name}. Awaiting review.`,
        is_read: false,
        created_at: r.date_reported
      });
    }

    const [pendingAppeals] = await db.execute(
      `SELECT a.appeal_id, a.challan_id, a.created_at,
              c.full_name AS citizen_name, ch.total_amount
       FROM APPEALS a
       JOIN CITIZENS c ON a.citizen_id = c.citizen_id
       JOIN CHALLANS ch ON a.challan_id = ch.challan_id
       WHERE a.status IN ('Pending','Under Review')
       ORDER BY a.created_at DESC LIMIT 10`
    ).catch(() => [[]]);

    for (const a of pendingAppeals) {
      notifications.push({
        notif_id: `apl-${a.appeal_id}`,
        notif_type: 'New Appeal',
        message: `Appeal #${a.appeal_id} from ${a.citizen_name} for Challan #${a.challan_id} (Rs. ${parseFloat(a.total_amount).toFixed(0)}). Awaiting decision.`,
        is_read: false,
        created_at: a.created_at
      });
    }

    notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      notifications,
      unread_count: notifications.length
    });
  } catch (e) {
    console.error('Police notifications error:', e.message);
    res.json({ notifications: [], unread_count: 0 });
  }
});

router_instance.put('/read-all/:citizenId', async (req, res) => {
  try {
    await db.execute(
      `UPDATE NOTIFICATIONS SET is_read=1 WHERE citizen_id=?`, [req.params.citizenId]
    );
  } catch {}
  res.json({ message: 'All marked as read.' });
});

router_instance.put('/police/:notifId/read', async (req, res) => {
  const { notifId } = req.params;
  
  if (/^\d+$/.test(notifId)) {
    try {
      await db.execute(`UPDATE NOTIFICATIONS SET is_read=1 WHERE notif_id=?`, [notifId]);
    } catch {}
  }
  res.json({ message: 'Marked as read.' });
});

router_instance.get('/:citizenId', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT notif_id, citizen_id, notif_type, message, is_read, created_at
       FROM NOTIFICATIONS WHERE citizen_id=? ORDER BY created_at DESC LIMIT 50`,
      [req.params.citizenId]
    );
    res.json({ notifications: rows, unread_count: rows.filter(r => !r.is_read).length });
  } catch (e) {
    res.json({ notifications: [], unread_count: 0 });
  }
});

router_instance.put('/:notifId/read', async (req, res) => {
  try {
    await db.execute(
      `UPDATE NOTIFICATIONS SET is_read=1 WHERE notif_id=?`, [req.params.notifId]
    );
  } catch {}
  res.json({ message: 'Marked as read.' });
});

module.exports = router_instance;
module.exports.notify = notify;
