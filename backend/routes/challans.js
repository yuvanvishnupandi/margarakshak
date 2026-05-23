const express = require('express');
const db = require('../db');
const router = express.Router();

// Safe date serializer
const fmtDate = (d) => {
  if (!d) return null;
  if (d instanceof Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (typeof d === 'string') return d.split('T')[0];
  return String(d);
};

// Helper: get challans by citizen_id via JOIN
// Also finds challans linked to any vehicle the citizen owns (via VEHICLES.citizen_id)
const fetchChallans = async (citizenId) => {
  try {
    const [rows] = await db.execute(
      `SELECT DISTINCT c.challan_id, c.total_amount, c.payment_status,
              c.issue_date, c.due_date, c.paid_at, c.transaction_ref,
              vr.rule_name, vr.rule_code, vr.base_fine_amount, vr.severity,
              ve.plate_no, ve.event_timestamp,
              r.location_address, r.description AS violation_description
       FROM CHALLANS c
       JOIN VIOLATION_EVENTS ve ON c.event_id = ve.event_id
       JOIN REPORTS r ON ve.report_id = r.report_id
       JOIN VIOLATION_RULES vr ON ve.rule_id = vr.rule_id
       LEFT JOIN VEHICLES v ON ve.plate_no = v.plate_no
       WHERE c.citizen_id = ? OR v.citizen_id = ?
       ORDER BY c.challan_id DESC`,
      [citizenId, citizenId]
    );
    // Normalize date fields so frontend always gets plain strings
    return rows.map(row => ({
      ...row,
      issue_date: fmtDate(row.issue_date),
      issued_at: fmtDate(row.issue_date),   // alias for backward compat
      due_date: fmtDate(row.due_date),
      paid_at: row.paid_at ? fmtDate(row.paid_at) : null,
      total_amount: parseFloat(row.total_amount) || 0
    }));
  } catch (err) {
    console.error('fetchChallans join error, falling back:', err.message);
    // Minimal fallback — also check via vehicle ownership
    const [rows2] = await db.execute(
      `SELECT DISTINCT c.challan_id, c.total_amount, c.payment_status,
              c.issue_date, c.due_date, c.paid_at
       FROM CHALLANS c
       LEFT JOIN VIOLATION_EVENTS ve ON c.event_id = ve.event_id
       LEFT JOIN VEHICLES v ON ve.plate_no = v.plate_no
       WHERE c.citizen_id = ? OR v.citizen_id = ?
       ORDER BY c.challan_id DESC`,
      [citizenId, citizenId]
    );
    return rows2.map(row => ({
      ...row,
      issue_date: fmtDate(row.issue_date),
      issued_at: fmtDate(row.issue_date),
      due_date: fmtDate(row.due_date),
      total_amount: parseFloat(row.total_amount) || 0
    }));
  }
};

// GET /api/challans/my?citizen_id=:id
router.get('/my', async (req, res) => {
  const citizenId = req.query.citizen_id;
  if (!citizenId) return res.status(400).json({ error: 'citizen_id query param required.' });
  try {
    const challans = await fetchChallans(citizenId);
    res.json({ challans, count: challans.length });
  } catch (err) {
    console.error('My challans error:', err);
    res.status(500).json({ error: 'Failed to fetch challans.', challans: [] });
  }
});

// GET /api/challans/citizen/:id
router.get('/citizen/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const challans = await fetchChallans(id);
    res.json({ challans, count: challans.length });
  } catch (err) {
    console.error('Citizen challans error:', err);
    res.status(500).json({ error: 'Failed to fetch challans.', challans: [] });
  }
});

// GET /api/challans/report/:reportId  — report details for challan creation
router.get('/report/:reportId', async (req, res) => {
  const { reportId } = req.params;
  try {
    const [[row]] = await db.execute(
      `SELECT r.report_id, r.plate_no, r.citizen_id AS reporter_id,
              r.violation_type, r.location_address, r.description,
              r.status, r.date_reported, r.evidence_path,
              v.citizen_id AS violator_citizen_id,
              v.owner_name AS violator_name,
              v.vehicle_model, v.vehicle_type,
              c.full_name AS reporter_full_name,
              c.email AS reporter_email,
              c.trust_score AS reporter_trust_score
       FROM REPORTS r
       LEFT JOIN VEHICLES v ON r.plate_no = v.plate_no
       LEFT JOIN CITIZENS c ON r.citizen_id = c.citizen_id
       WHERE r.report_id=?`,
      [reportId]
    );
    if (!row) return res.status(404).json({ error: 'Report not found.' });
    row.date_reported = row.date_reported ? fmtDate(row.date_reported) : null;
    res.json({ report: row });
  } catch (err) {
    console.error('Report for challan error:', err);
    res.status(500).json({ error: 'Failed to fetch report.' });
  }
});

// PUT /api/challans/pay/:challanId
router.put('/pay/:challanId', async (req, res) => {
  const { challanId } = req.params;
  const { payment_method, late_fee } = req.body;
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [[row]] = await conn.execute(
      `SELECT payment_status, total_amount, citizen_id, due_date FROM CHALLANS WHERE challan_id=? FOR UPDATE`,
      [challanId]
    );
    if (!row) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Challan not found.' }); }
    if (row.payment_status === 'Paid') { await conn.rollback(); conn.release(); return res.status(409).json({ error: 'Already paid.' }); }

    // Tiered late fee — Indian MV Act enforcement style (matches frontend display)
    const baseAmount = parseFloat(row.total_amount) || 0;
    let serverLateFee = 0;
    if (row.due_date) {
      const dueDate = new Date(row.due_date);
      dueDate.setHours(23, 59, 59, 999);
      const today = new Date();
      if (today > dueDate) {
        const daysOverdue = Math.max(1, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
        let latePct = 0;
        if      (daysOverdue <= 3)  latePct = 5;
        else if (daysOverdue <= 7)  latePct = 10;
        else if (daysOverdue <= 15) latePct = 20;
        else if (daysOverdue <= 30) latePct = 35;
        else                        latePct = 50;
        serverLateFee = parseFloat((baseAmount * latePct / 100).toFixed(2));
      }
    }

    // Use server-computed late fee (ignore client value for security)
    const totalPayable = parseFloat((baseAmount + serverLateFee).toFixed(2));

    const txnRef = 'TXN' + Date.now();

    // Update challan — mark paid, store late fee and total
    await conn.execute(
      `UPDATE CHALLANS SET payment_status='Paid', paid_at=NOW(), transaction_ref=?,
       total_amount=? WHERE challan_id=?`,
      [txnRef, totalPayable, challanId]
    );

    // Remove from OVERDUE_LOG if it was there
    try {
      await conn.execute(`DELETE FROM OVERDUE_LOG WHERE challan_id=?`, [challanId]);
    } catch (ole) { console.warn('OVERDUE_LOG delete skipped:', ole.message); }

    // Record in PAYMENT_TRANSACTIONS ledger
    try {
      await conn.execute(
        `INSERT INTO PAYMENT_TRANSACTIONS (challan_id, citizen_id, amount_paid, payment_method, transaction_ref)
         VALUES (?, ?, ?, ?, ?)`,
        [challanId, row.citizen_id, totalPayable, payment_method || 'UPI', txnRef]
      );
    } catch (pe) { console.warn('PAYMENT_TRANSACTIONS insert skipped:', pe.message); }

    // Reward citizen +2 points for paying
    try {
      await conn.execute(
        `UPDATE CITIZENS SET reward_points = reward_points + 2 WHERE citizen_id=?`,
        [row.citizen_id]
      );
    } catch (re) { console.warn('Reward points skip:', re.message); }

    // Notify citizen
    try {
      const msg = serverLateFee > 0
        ? `Payment of Rs.${totalPayable.toFixed(2)} for Challan #${challanId} confirmed (includes Rs.${serverLateFee.toFixed(2)} late fee). Ref: ${txnRef}. +2 reward points!`
        : `Payment of Rs.${totalPayable.toFixed(2)} for Challan #${challanId} confirmed. Ref: ${txnRef}. +2 reward points added!`;
      await conn.execute(
        `INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message, is_read) VALUES (?, 'General', ?, 0)`,
        [row.citizen_id, msg]
      );
    } catch (ne) { console.warn('Notify skip:', ne.message); }

    await conn.commit();
    conn.release();
    res.json({
      message: 'Payment successful.',
      challan_id: challanId,
      base_amount: baseAmount,
      late_fee: serverLateFee,
      amount_paid: totalPayable,
      payment_status: 'Paid',
      transaction_ref: txnRef
    });
  } catch (err) {
    if (conn) { await conn.rollback(); conn.release(); }
    console.error('Pay challan error:', err);
    res.status(500).json({ error: 'Payment failed: ' + err.message });
  }
});


// POST /api/challans/create
router.post('/create', async (req, res) => {
  const { report_id, rule_id, badge_no, total_amount, notes } = req.body;
  if (!report_id || !rule_id) return res.status(400).json({ error: 'report_id and rule_id required.' });
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // Get report + vehicle owner (read version for optimistic locking)
    const [[report]] = await conn.execute(
      `SELECT r.report_id, r.plate_no, r.citizen_id AS reporter_id, r.status,
              v.citizen_id AS violator_citizen_id
       FROM REPORTS r
       LEFT JOIN VEHICLES v ON r.plate_no = v.plate_no
       WHERE r.report_id=?`,
      [report_id]
    );
    if (!report) {
      await conn.rollback(); conn.release();
      return res.status(404).json({ error: 'Report not found.' });
    }

    // State Lock: Ensure report is still pending
    if (report.status !== 'Pending') {
      await conn.rollback(); conn.release();
      return res.status(409).json({ error: 'Concurrency Error: Report has already been processed by another officer.' });
    }

    // Determine who gets the challan:
    // 1. Registered vehicle owner in VEHICLES (violator_citizen_id)
    // 2. If not found, look up citizens who own this plate by other means
    // 3. Last resort: reporter
    let violator_id = report.violator_citizen_id;
    if (!violator_id) {
      // Try to find citizen who has this plate linked elsewhere
      const [[ownerLookup]] = await conn.execute(
        `SELECT citizen_id FROM VEHICLES WHERE plate_no=? AND citizen_id IS NOT NULL LIMIT 1`,
        [report.plate_no]
      ).catch(() => [[null]]);
      violator_id = ownerLookup?.citizen_id || report.reporter_id;
    }

    // Create VIOLATION_EVENT
    const [evtResult] = await conn.execute(
      `INSERT INTO VIOLATION_EVENTS (report_id, rule_id, plate_no, event_timestamp, notes)
       VALUES (?,?,?,NOW(),?)`,
      [report_id, rule_id, report.plate_no, notes || '']
    );
    const event_id = evtResult.insertId;

    // Create CHALLAN linked to violator
    const [chalResult] = await conn.execute(
      `INSERT INTO CHALLANS (event_id, citizen_id, badge_no, total_amount, payment_status,
                             issue_date, due_date)
       VALUES (?,?,?,?,'Unpaid',CURDATE(),DATE_ADD(CURDATE(), INTERVAL 30 DAY))`,
      [event_id, violator_id, badge_no || 'POL0001', parseFloat(total_amount) || 0]
    );

    // 🔴 Concurrency Control Engine (Optimistic Locking)
    // Mark report as Verified ONLY if the version hasn't changed since we read it
    const finalBadgeNo = (badge_no && badge_no !== 'undefined' && badge_no !== 'null') ? badge_no : 'POL0001';
    
    let updateRpt;
    try {
      [updateRpt] = await conn.execute(
        `UPDATE REPORTS SET status='Verified', reviewed_at=NOW(), reviewed_by=?, version=version+1 
         WHERE report_id=? AND status='Pending'`,
        [finalBadgeNo, report_id]
      );
    } catch (versionErr) {
      // version column may not exist — fallback without it
      [updateRpt] = await conn.execute(
        `UPDATE REPORTS SET status='Verified', reviewed_at=NOW(), reviewed_by=?
         WHERE report_id=? AND status='Pending'`,
        [finalBadgeNo, report_id]
      );
    }

    // ACID Integrity Check: If 0 rows updated, a race condition occurred!
    if (updateRpt.affectedRows === 0) {
      await conn.rollback(); conn.release();
      return res.status(409).json({ 
        error: 'Concurrency Error: This report was modified by another officer simultaneously. Transaction aborted to prevent duplicate challans.' 
      });
    }

    // 🔔 Notify violator: challan issued
    try {
      await conn.execute(
        `INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message, is_read)
         VALUES (?, 'Challan Issued',
                 CONCAT('A challan of Rs.', ?, ' has been issued for your vehicle ',
                        ?, '. Please pay before ', DATE_ADD(CURDATE(), INTERVAL 30 DAY), '.'),
                 0)`,
        [violator_id, parseFloat(total_amount) || 0, report.plate_no]
      );
      // Also notify reporter if different from violator
      if (report.reporter_id) {
        // The SQL Trigger automatically applies Trust Score (+10) and Reward Points (+50)
        
        if (report.reporter_id !== violator_id) {
          await conn.execute(
            `INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message, is_read)
             VALUES (?, 'Report Verified',
                     CONCAT('Your report #', ?, ' for vehicle ', ?, ' has been verified and a challan of Rs.', ?, ' has been issued. (+10 Trust Score, +50 Reward Points)'),
                     0)`,
            [report.reporter_id, report_id, report.plate_no, parseFloat(total_amount) || 0]
          );
        }
      }
    } catch (ne) { console.warn('Notification insert skipped:', ne.message); }

    await conn.commit();
    conn.release();

    res.status(201).json({
      message: 'Challan created successfully.',
      challan_id: chalResult.insertId,
      event_id,
      total_amount: parseFloat(total_amount) || 0,
      violator_citizen_id: violator_id
    });
  } catch (err) {
    if (conn) { await conn.rollback(); conn.release(); }
    console.error('Create challan error:', err);
    res.status(500).json({ error: 'Failed to create challan: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/challans/direct-issue — On-spot police citations
// ─────────────────────────────────────────────────────────────────────
router.post('/direct-issue', async (req, res) => {
  const { plate_no, rule_id, badge_no, total_amount, notes } = req.body;
  if (!plate_no || !rule_id) return res.status(400).json({ error: 'plate_no and rule_id required.' });
  
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // ── FOOLPROOF CITIZEN ID LOGIC ──
    console.log('[DirectIssue] Processing for Plate:', plate_no);

    // 1. Get vehicle owner if exists
    const [[veh]] = await conn.execute(`SELECT citizen_id FROM VEHICLES WHERE plate_no=?`, [plate_no.toUpperCase()]);
    console.log('[DirectIssue] Vehicle Owner Found:', veh?.citizen_id || 'NONE');

    // 2. Find a fallback citizen_id (System Account or first user)
    let fallbackId = 1; // absolute last resort
    try {
      const [cits] = await conn.execute(`SELECT citizen_id FROM CITIZENS ORDER BY citizen_id ASC LIMIT 1`);
      if (cits && cits.length > 0) {
        fallbackId = cits[0].citizen_id;
      }
    } catch (citErr) {
      console.error('[DirectIssue] Failed to fetch fallback citizen:', citErr.message);
    }
    console.log('[DirectIssue] Fallback ID determined:', fallbackId);

    // 3. Force a valid, non-null ID (PRIORITY: Owner > Fallback > 1)
    let violator_id = (veh && veh.citizen_id) ? veh.citizen_id : fallbackId;
    if (!violator_id) violator_id = 1; 
    
    console.log('[DirectIssue] FINAL Violator ID to be used:', violator_id);

    // 4. Ensure vehicle exists in DB (to prevent FK errors in REPORTS)
    if (!veh) {
      console.log('[DirectIssue] Creating unknown vehicle record...');
      await conn.execute(
        `INSERT INTO VEHICLES (plate_no, vehicle_model, vehicle_type, owner_name, owner_type, citizen_id)
         VALUES (?,?,?,?,?,?)`,
        [plate_no.toUpperCase(), 'Unknown', 'Other', 'Unknown', 'Individual', violator_id]
      );
    }

    // 5. Create Report (Verified)
    console.log('[DirectIssue] Inserting into REPORTS...');
    const [rptResult] = await conn.execute(
      `INSERT INTO REPORTS (citizen_id, plate_no, violation_type, location_coords, location_address,
                            description, evidence_path, status, date_reported, reviewed_at, reviewed_by)
       VALUES (?, ?, 'Direct Citation', NULL, 'On-Spot Police Check', ?, NULL, 'Verified', NOW(), NOW(), ?)`,
      [violator_id, plate_no.toUpperCase(), notes || 'Directly issued by officer on patrol', badge_no || 'POL0001']
    );
    const report_id = rptResult.insertId;

    // 6. Create VIOLATION_EVENT
    console.log('[DirectIssue] Inserting into VIOLATION_EVENTS...');
    const [evtResult] = await conn.execute(
      `INSERT INTO VIOLATION_EVENTS (report_id, rule_id, plate_no, event_timestamp, notes)
       VALUES (?,?,?,NOW(),?)`,
      [report_id, rule_id, plate_no.toUpperCase(), notes || '']
    );
    const event_id = evtResult.insertId;

    // 7. Create CHALLAN
    console.log('[DirectIssue] Inserting into CHALLANS...');
    const [chalResult] = await conn.execute(
      `INSERT INTO CHALLANS (event_id, citizen_id, badge_no, total_amount, payment_status,
                             issue_date, due_date)
       VALUES (?,?,?,?,'Unpaid',CURDATE(),DATE_ADD(CURDATE(), INTERVAL 30 DAY))`,
      [event_id, violator_id, badge_no || 'POL0001', parseFloat(total_amount) || 0]
    );

    // 8. Notify
    console.log('[DirectIssue] Sending notification...');
    await conn.execute(
      `INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message, is_read)
       VALUES (?, 'Challan Issued',
               CONCAT('An on-spot challan of Rs.', ?, ' has been issued for your vehicle ',
                      ?, '. Please check the portal for payment details. Challan ID: #', ?),
               0)`,
      [violator_id, parseFloat(total_amount) || 0, plate_no.toUpperCase(), chalResult.insertId]
    );

    await conn.commit();
    conn.release();
    res.status(201).json({ success: true, message: 'Direct challan issued successfully.', challan_id: chalResult.insertId });
  } catch (err) {
    if (conn) { await conn.rollback(); conn.release(); }
    console.error('Direct issue error:', err);
    res.status(500).json({ error: 'Failed to issue direct challan: ' + err.message });
  }
});

module.exports = router;
