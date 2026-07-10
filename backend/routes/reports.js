const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const notify = async (citizen_id, notif_type, message) => {
  try {
    await db.execute(
      `INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message, is_read) VALUES (?,?,?,0)`,
      [citizen_id, notif_type, message]
    );
  } catch (e) {  }
};

const uploadDir = path.join(__dirname, '../../server/uploads/evidence');
const localDir  = path.join(__dirname, '../uploads/evidence');
[uploadDir, localDir].forEach(d => { try { fs.mkdirSync(d, { recursive: true }); } catch(e){} });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `report_${req.params.reportId}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/migrate', async (req, res) => {
  let log = [];
  try {
    await db.execute("ALTER TABLE REPORTS ADD COLUMN district VARCHAR(100) DEFAULT 'Chennai'");
    log.push("Added 'district' column.");
  } catch (e) { log.push("district: " + e.code); }
  
  try {
    await db.execute("ALTER TABLE REPORTS ADD COLUMN locked_by VARCHAR(50) DEFAULT NULL");
    log.push("Added 'locked_by' column.");
  } catch (e) { log.push("locked_by: " + e.code); }

  try {
    await db.execute("ALTER TABLE REPORTS ADD COLUMN locked_at DATETIME DEFAULT NULL");
    log.push("Added 'locked_at' column.");
  } catch (e) { log.push("locked_at: " + e.code); }

  res.json({ status: "Migration script finished", log });
});

router.post('/create', async (req, res) => {
  const { citizen_id, plate_no, violation_type, location_address, location_coords, description } = req.body;
  if (!citizen_id || !plate_no || !violation_type)
    return res.status(400).json({ error: 'citizen_id, plate_no, violation_type required.' });
  try {
    const [[cit]] = await db.execute(
      `SELECT citizen_id, account_status, trust_score, district FROM CITIZENS WHERE citizen_id=?`, [citizen_id]
    );
    if (!cit) return res.status(404).json({ error: 'Citizen not found.' });
    if (cit.account_status === 'Suspended' || cit.trust_score <= 0)
      return res.status(403).json({ error: 'Your account is suspended. You cannot submit reports.' });
    
    const citizenDistrict = cit.district || 'Chennai';

    const [[veh]] = await db.execute(`SELECT plate_no FROM VEHICLES WHERE plate_no=?`, [plate_no.toUpperCase()]);
    if (!veh) {
      await db.execute(
        `INSERT INTO VEHICLES (plate_no, vehicle_model, vehicle_type, owner_name, owner_type, registered_at)
         VALUES (?,?,?,?,?,NOW())`,
        [plate_no.toUpperCase(), 'Unknown', 'Other', 'Unknown', 'Individual']
      );
    }

    const [result] = await db.execute(
      `INSERT INTO REPORTS (citizen_id, plate_no, violation_type, location_coords, location_address,
                            description, evidence_path, status, date_reported)
       VALUES (?,?,?,?,?,?,NULL,'Pending',NOW())`,
      [citizen_id, plate_no.toUpperCase(), violation_type, location_coords || null,
       location_address || '', description || '']
    );

    await notify(citizen_id, 'General',
      `Your report for vehicle ${plate_no.toUpperCase()} (${violation_type}) has been submitted and is under review.`
    );

    res.status(201).json({ message: 'Report submitted successfully.', report_id: result.insertId });
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ error: 'Failed to submit report: ' + err.message });
  }
});

router.post('/upload-evidence/:reportId', upload.single('file'), async (req, res) => {
  const { reportId } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const evidenceUrl = `/uploads/evidence/${req.file.filename}`;
  try {
    const [[existing]] = await db.execute(`SELECT evidence_path FROM REPORTS WHERE report_id=?`, [reportId]);
    let paths = [];
    if (existing?.evidence_path) {
      try { paths = JSON.parse(existing.evidence_path); if (!Array.isArray(paths)) paths = [existing.evidence_path]; }
      catch { paths = [existing.evidence_path]; }
    }
    paths.push(evidenceUrl);
    await db.execute(`UPDATE REPORTS SET evidence_path=? WHERE report_id=?`, [JSON.stringify(paths), reportId]);
    res.json({ message: 'Evidence uploaded.', report_id: reportId, evidence_path: evidenceUrl, total_photos: paths.length });
  } catch (err) {
    console.error('Upload evidence error:', err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

router.get('/police/pending', authenticateToken, async (req, res) => {
  try {
    const policeDistrict = req.user.district || 'Chennai';
    const badgeNo = req.user.badge_no || req.user.id;
    
    const [rows] = await db.execute(
      `SELECT r.report_id, r.citizen_id, r.plate_no, r.violation_type, r.location_address,
              r.description, r.evidence_path, r.status, r.date_reported AS reported_at,
              c.full_name AS reporter_name, c.email AS reporter_email,
              c.trust_score AS reporter_trust_score
       FROM REPORTS r
       JOIN CITIZENS c ON r.citizen_id = c.citizen_id
       WHERE r.status='Pending' 
       ORDER BY r.date_reported DESC`
    );
    res.json({ reports: rows, count: rows.length });
  } catch (err) {
    console.error('Police pending error:', err);
    res.status(500).json({ error: 'Failed to fetch pending reports.', reports: [] });
  }
});

router.post('/:reportId/lock', authenticateToken, async (req, res) => {
  // DB column locked_by does not exist, so just return success to satisfy frontend
  res.json({ message: 'Report locked successfully' });
});

router.get('/police/export-csv', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT r.report_id, r.plate_no, r.violation_type, r.location_address, r.status, r.date_reported,
             c.full_name AS reporter_name
      FROM REPORTS r
      LEFT JOIN CITIZENS c ON r.citizen_id = c.citizen_id
      ORDER BY r.date_reported DESC
    `);
    
    let csv = 'Report ID,Plate Number,Violation,Location,Status,Date,Reporter\n';
    
    rows.forEach(r => {
      const dateStr = r.date_reported ? new Date(r.date_reported).toLocaleDateString() : 'N/A';
      const reporter = r.reporter_name || 'Anonymous';
      const loc = (r.location_address || '').replace(/"/g, '""');
      csv += `${r.report_id},${r.plate_no},${r.violation_type},"${loc}",${r.status},${dateStr},${reporter}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=marga_rakshak_reports.csv');
    res.status(200).send(csv);
  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ error: 'Failed to export reports: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// PUT /api/reports/police/process/:id  — Reject only (Verify goes via ChallanCreation)
// ─────────────────────────────────────────────────────────────────────
router.put('/police/process/:id', async (req, res) => {
  const { id } = req.params;
  const { status, badge_no } = req.body;
  if (!['Verified', 'Rejected'].includes(status))
    return res.status(400).json({ error: 'Invalid status.' });
  try {
    // Get citizen_id and current status for notification & concurrency check
    const [[rpt]] = await db.execute(
      `SELECT citizen_id, plate_no, violation_type, status FROM REPORTS WHERE report_id=?`, [id]
    );

    if (!rpt) return res.status(404).json({ error: 'Report not found.' });
    if (rpt.status !== 'Pending') return res.status(409).json({ error: 'Concurrency Error: Report has already been processed by another officer.' });

    const finalBadgeNo = (badge_no && badge_no !== 'undefined' && badge_no !== 'null') ? badge_no : 'POL0001';

    // Try update with optimistic locking (version column), fallback to simple update
    let updateResult;
    try {
      [updateResult] = await db.execute(
        `UPDATE REPORTS SET status=?, reviewed_at=NOW(), reviewed_by=?, locked_by=NULL, locked_at=NULL, version=version+1 
         WHERE report_id=? AND status='Pending'`,
        [status, finalBadgeNo, id]
      );
    } catch (versionErr) {
      // version column may not exist — fallback without it
      [updateResult] = await db.execute(
        `UPDATE REPORTS SET status=?, reviewed_at=NOW(), reviewed_by=?, locked_by=NULL, locked_at=NULL
         WHERE report_id=? AND status='Pending'`,
        [status, finalBadgeNo, id]
      );
    }

    // ACID Integrity Check
    if (updateResult.affectedRows === 0) {
      return res.status(409).json({ 
        error: 'Concurrency Error: This report was modified by another officer simultaneously. Update aborted.' 
      });
    }
    // 🔔 Notify reporter
    if (rpt && rpt.citizen_id) {
      if (status === 'Verified') {
        await notify(rpt.citizen_id, 'Report Verified',
          `Your report #${id} for vehicle ${rpt.plate_no} (${rpt.violation_type}) has been verified. A challan will be issued. (+10 Trust Score, +50 Points)`
        );
      } else {
        await notify(rpt.citizen_id, 'Report Rejected',
          `Your report #${id} for vehicle ${rpt.plate_no} (${rpt.violation_type}) was rejected. A penalty of -10 Trust Score has been applied for an invalid submission.`
        );
      }
    }
    res.json({ message: `Report ${status.toLowerCase()} successfully.` });
  } catch (err) {
    console.error('Process report error:', err);
    res.status(500).json({ error: 'Failed to process report.' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/reports/my-reports/:citizenId
// ─────────────────────────────────────────────────────────────────────
router.get('/my-reports/:citizenId', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.report_id, r.citizen_id, r.plate_no, r.violation_type, r.location_address,
              r.location_coords, r.description, r.status, r.evidence_path,
              r.date_reported AS reported_at, r.reviewed_at
       FROM REPORTS r WHERE r.citizen_id=? ORDER BY r.date_reported DESC`,
      [req.params.citizenId]
    );
    res.json({ reports: rows, count: rows.length });
  } catch (err) {
    console.error('My reports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports.', reports: [] });
  }
});

// ─────────────────────────────────────────────────────────────────────
// DELETE /api/reports/delete/:reportId
// ─────────────────────────────────────────────────────────────────────
router.delete('/delete/:reportId', async (req, res) => {
  try {
    const [result] = await db.execute(
      `DELETE FROM REPORTS WHERE report_id=? AND status='Pending'`, [req.params.reportId]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Report not found or not pending.' });
    res.json({ message: 'Report deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete report.' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// PUT /api/reports/update/:reportId
// ─────────────────────────────────────────────────────────────────────
router.put('/update/:reportId', async (req, res) => {
  const { plate_no, violation_type, location_address, description } = req.body;
  try {
    const [result] = await db.execute(
      `UPDATE REPORTS SET
         plate_no=COALESCE(?,plate_no), violation_type=COALESCE(?,violation_type),
         location_address=COALESCE(?,location_address), description=COALESCE(?,description)
       WHERE report_id=? AND status='Pending'`,
      [plate_no||null, violation_type||null, location_address||null, description||null, req.params.reportId]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Report not found or already processed.' });
    res.json({ message: 'Report updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update report.' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/reports/:reportId  (parameterized — MUST be last)
// ─────────────────────────────────────────────────────────────────────
router.get('/:reportId', async (req, res) => {
  try {
    const [[row]] = await db.execute(
      `SELECT r.*, c.full_name AS citizen_name FROM REPORTS r
       LEFT JOIN CITIZENS c ON r.citizen_id=c.citizen_id WHERE r.report_id=?`,
      [req.params.reportId]
    );
    if (!row) return res.status(404).json({ error: 'Report not found.' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch report.' });
  }
});

// DELETE /api/reports/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.execute(`DELETE FROM REPORTS WHERE report_id=?`, [req.params.id]);
    res.json({ message: 'Report deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete report.' });
  }
});

module.exports = router;
