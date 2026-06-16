const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/leaderboard', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT c.citizen_id, c.full_name, c.email,
             c.trust_score, c.reward_points,
             COUNT(r.report_id) AS reports_submitted
      FROM CITIZENS c
      LEFT JOIN REPORTS r ON c.citizen_id = r.citizen_id
      GROUP BY c.citizen_id, c.full_name, c.email, c.trust_score, c.reward_points
      ORDER BY c.trust_score DESC, c.reward_points DESC
      LIMIT 20`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ success: false, data: [], error: err.message });
  }
});

router.get('/citizen/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [[citizen]] = await db.execute(
      `SELECT trust_score, reward_points FROM CITIZENS WHERE citizen_id = ?`, [id]
    );

    const [[rStats]] = await db.execute(`
      SELECT
        COUNT(*) AS total_reports,
        SUM(status = 'Pending')  AS total_pending,
        SUM(status = 'Verified' OR status = 'Challan Issued') AS total_verified,
        SUM(status = 'Rejected') AS total_rejected
      FROM REPORTS WHERE citizen_id = ?`, [id]
    );

    const months = Math.max(1, Math.min(24, parseInt(req.query.months) || 6));
    const [monthly] = await db.execute(`
      SELECT
        DATE_FORMAT(date_reported, '%b %Y') AS month,
        DATE_FORMAT(date_reported, '%Y-%m') AS month_key,
        COUNT(*) AS count,
        SUM(status='Verified' OR status='Challan Issued') AS verified
      FROM REPORTS
      WHERE citizen_id = ?
        AND date_reported >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY month_key, month
      ORDER BY month_key ASC`, [id, months]
    );

    const [topViolations] = await db.execute(`
      SELECT vr.rule_name AS violation_type, COUNT(*) AS count
      FROM REPORTS r
      JOIN VIOLATION_EVENTS ve ON r.report_id = ve.report_id
      JOIN VIOLATION_RULES vr ON ve.rule_id = vr.rule_id
      WHERE r.citizen_id = ?
      GROUP BY vr.rule_name ORDER BY count DESC LIMIT 5`, [id]
    );

    const [challans] = await db.execute(`
      SELECT
        COUNT(*) AS total_challans,
        SUM(payment_status='Unpaid') AS unpaid,
        SUM(payment_status='Paid') AS paid,
        COALESCE(SUM(CASE WHEN payment_status='Unpaid' THEN total_amount END),0) AS total_due,
        COALESCE(SUM(CASE WHEN payment_status='Paid' THEN total_amount END),0) AS total_paid
      FROM CHALLANS WHERE citizen_id = ?`, [id]
    );

    res.json({
      success: true,
      data: {
        trust_score: citizen?.trust_score ?? 50,
        reward_points: citizen?.reward_points ?? 0,
        total_reports: rStats.total_reports || 0,
        total_pending: rStats.total_pending || 0,
        total_verified: rStats.total_verified || 0,
        total_rejected: rStats.total_rejected || 0,
        monthly_trend: monthly,
        top_violations: topViolations,
        challans: challans[0] || {},
      }
    });
  } catch (err) {
    console.error('Citizen analytics error:', err);
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

router.get('/police/system', async (req, res) => {
  try {
    const [[rStats]] = await db.execute(`
      SELECT
        COUNT(*) AS total_reports,
        SUM(status='Pending')  AS total_pending,
        SUM(status='Verified' OR status='Challan Issued') AS total_verified,
        SUM(status='Rejected') AS total_rejected
      FROM REPORTS`
    );

    const [[cStats]] = await db.execute(`
      SELECT
        COUNT(*) AS total_challans,
        SUM(payment_status='Unpaid') AS unpaid_challans,
        SUM(payment_status='Paid') AS paid_challans,
        COALESCE(SUM(CASE WHEN payment_status='Paid' THEN total_amount END),0) AS fines_collected,
        COALESCE(SUM(CASE WHEN payment_status='Unpaid' THEN total_amount END),0) AS fines_pending
      FROM CHALLANS`
    );

    const months = Math.max(1, Math.min(24, parseInt(req.query.months) || 6));
    const [monthly] = await db.execute(`
      SELECT
        DATE_FORMAT(date_reported,'%b %Y') AS month,
        DATE_FORMAT(date_reported,'%Y-%m') AS month_key,
        COUNT(*) AS count,
        SUM(status='Verified' OR status='Challan Issued') AS verified,
        SUM(status='Rejected') AS rejected
      FROM REPORTS
      WHERE date_reported >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY month_key, month ORDER BY month_key ASC`, [months]
    );

    const [[dailyNew]] = await db.execute(
      `SELECT COUNT(*) AS count FROM REPORTS WHERE DATE(date_reported)=CURDATE()`
    );

    const [[weeklyNew]] = await db.execute(
      `SELECT COUNT(*) AS count FROM REPORTS WHERE date_reported >= DATE_SUB(NOW(),INTERVAL 7 DAY)`
    );

    const [officers] = await db.execute(`
      SELECT p.badge_no AS police_id, p.full_name,
        SUM(r.status='Verified' OR r.status='Challan Issued') AS total_verified,
        SUM(r.status='Rejected') AS total_rejected
      FROM POLICE_OFFICERS p
      LEFT JOIN REPORTS r ON p.badge_no = r.reviewed_by
      GROUP BY p.badge_no, p.full_name
      HAVING total_verified > 0
      ORDER BY total_verified DESC LIMIT 5`
    ).catch(() => [[]]);

    res.json({
      success: true,
      data: {
        total_reports: rStats.total_reports || 0,
        total_pending: rStats.total_pending || 0,
        total_verified: rStats.total_verified || 0,
        total_rejected: rStats.total_rejected || 0,
        total_challans: cStats.total_challans || 0,
        unpaid_challans: cStats.unpaid_challans || 0,
        paid_challans: cStats.paid_challans || 0,
        fines_collected: parseFloat(cStats.fines_collected) || 0,
        fines_pending: parseFloat(cStats.fines_pending) || 0,
        daily_new: dailyNew.count || 0,
        weekly_new: weeklyNew.count || 0,
        monthly_trend: monthly,
        top_officers: officers || [],
      }
    });
  } catch (err) {
    console.error('Police system analytics error:', err);
    res.status(500).json({ success: false, data: null, error: err.message });
  }
});

router.get('/violation-types', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT violation_type, COUNT(*) AS count
      FROM REPORTS GROUP BY violation_type ORDER BY count DESC LIMIT 10`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Violation types error:', err);
    res.status(500).json({ success: false, data: [], error: err.message });
  }
});

router.get('/heatmap-data', async (req, res) => {
  try {
    
    const [rows] = await db.execute(`
      SELECT report_id AS id, location_coords, violation_type,
             location_address, status, DATE(date_reported) AS date
      FROM REPORTS
      WHERE location_coords IS NOT NULL AND location_coords <> ''
      ORDER BY date_reported DESC LIMIT 200`
    );
    
    const parsed = rows.map(r => {
      const parts = (r.location_coords || '').split(',');
      return {
        ...r,
        lat: parseFloat(parts[0]) || null,
        lng: parseFloat(parts[1]) || null
      };
    }).filter(r => r.lat && r.lng);
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('Heatmap error:', err);
    res.status(500).json({ success: false, data: [], error: err.message });
  }
});

router.get('/police-summary', async (req, res) => {
  try {
    const [[stats]] = await db.execute(`
      SELECT
        COUNT(*) AS total_processed,
        SUM(status='Pending') AS pending_count,
        SUM(status='Verified') AS verified_count,
        SUM(status='Rejected') AS rejected_count
      FROM REPORTS`
    );
    const [[challanStats]] = await db.execute(`
      SELECT
        COUNT(*) AS active_challans,
        COALESCE(SUM(CASE WHEN payment_status='Paid' THEN total_amount END),0) AS fines_collected
      FROM CHALLANS`
    );
    res.json({
      success: true,
      data: {
        total_processed: stats.total_processed || 0,
        pending_count: stats.pending_count || 0,
        verified_count: stats.verified_count || 0,
        rejected_count: stats.rejected_count || 0,
        active_challans: challanStats.active_challans || 0,
        fines_collected: parseFloat(challanStats.fines_collected) || 0,
      }
    });
  } catch (err) {
    console.error('Police summary error:', err);
    res.status(500).json({ success: false, data: {}, error: err.message });
  }
});

router.get('/appeals/police/pending', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT a.appeal_id, a.status, a.reason,
             ve.plate_no, c.total_amount,
             ci.full_name AS citizen_name,
             vr.rule_name,
             a.created_at
      FROM APPEALS a
      JOIN CHALLANS c ON a.challan_id = c.challan_id
      JOIN VIOLATION_EVENTS ve ON c.event_id = ve.event_id
      JOIN VIOLATION_RULES vr ON ve.rule_id = vr.rule_id
      JOIN CITIZENS ci ON a.citizen_id = ci.citizen_id
      WHERE a.status IN ('Pending','Under Review')
      ORDER BY a.created_at DESC LIMIT 10`
    );
    res.json({ success: true, appeals: rows });
  } catch (err) {
    console.error('Analytics pending appeals error:', err);
    
    try {
      const [r2] = await db.execute(`SELECT appeal_id, status, reason, created_at FROM APPEALS WHERE status='Pending' LIMIT 10`);
      res.json({ success: true, appeals: r2 });
    } catch (e) {
      res.status(500).json({ success: false, appeals: [], error: e.message });
    }
  }
});

router.get('/heatmap-data', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT location_coords, location_address, violation_type, status 
      FROM REPORTS 
      WHERE location_coords IS NOT NULL AND location_coords != ''
    `);
    
    const heatmap = rows.map(r => {
      let lat = 13.0827, lng = 80.2707; 
      try {
        if (r.location_coords.includes(',')) {
          const parts = r.location_coords.split(',');
          lat = parseFloat(parts[0]);
          lng = parseFloat(parts[1]);
        }
      } catch (e) {}
      return { 
        lat, lng, 
        address: r.location_address, 
        type: r.violation_type, 
        status: r.status 
      };
    }).filter(r => !isNaN(r.lat) && !isNaN(r.lng));

    res.json({ success: true, data: heatmap });
  } catch (err) {
    console.error('Heatmap data error:', err);
    res.status(500).json({ success: false, data: [], error: err.message });
  }
});

module.exports = router;
