const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/vehicles/search/:plateNo
router.get('/search/:plateNo', async (req, res) => {
  const plate = req.params.plateNo.toUpperCase().replace(/\s+/g, '');
  try {
    const [[vehicle]] = await db.execute(
      `SELECT v.plate_no, v.vehicle_type, v.vehicle_model, v.owner_name,
              v.owner_type, v.registered_at, v.citizen_id,
              c.full_name AS citizen_name, c.email AS citizen_email,
              c.trust_score
       FROM VEHICLES v
       LEFT JOIN CITIZENS c ON v.citizen_id = c.citizen_id
       WHERE REPLACE(v.plate_no,' ','') = ?`, [plate]
    ).catch(() => [[null]]);

    if (!vehicle) {
      return res.status(404).json({ detail: 'Vehicle not found in database.' });
    }

    const [violations] = await db.execute(
      `SELECT r.report_id,
              r.date_reported AS event_timestamp,
              r.location_address, r.status, r.description AS violation_description,
              ch.challan_id, ch.total_amount, ch.payment_status,
              ch.issue_date, ch.due_date,
              vr.rule_name, vr.rule_code, vr.severity, vr.base_fine_amount
       FROM REPORTS r
       LEFT JOIN VIOLATION_EVENTS ve ON r.report_id = ve.report_id
       LEFT JOIN CHALLANS ch ON ve.event_id = ch.event_id
       LEFT JOIN VIOLATION_RULES vr ON ve.rule_id = vr.rule_id
       WHERE REPLACE(r.plate_no,' ','') = ?
       ORDER BY r.date_reported DESC`, [plate]
    );

    const unpaid = violations.filter(v => ['Unpaid','Overdue'].includes(v.payment_status));
    res.json({
      vehicle,
      violations,
      summary: {
        total_violations: violations.length,
        unpaid_challans: unpaid.length,
        total_unpaid_amount: unpaid.reduce((s, v) => s + parseFloat(v.total_amount || 0), 0)
      }
    });
  } catch (err) {
    console.error('Vehicle search error:', err);
    res.status(500).json({ detail: 'Search failed: ' + err.message });
  }
});

// POST /api/vehicles/register
router.post('/register', async (req, res) => {
  const { plate_no, vehicle_model, vehicle_type, owner_name, owner_type, citizen_id } = req.body;
  if (!plate_no) return res.status(400).json({ error: 'plate_no required.' });
  try {
    const [[existing]] = await db.execute(
      `SELECT plate_no FROM VEHICLES WHERE plate_no=?`, [plate_no.toUpperCase()]
    );
    if (existing) return res.status(409).json({ error: 'Vehicle already registered.', plate_no: existing.plate_no });
    await db.execute(
      `INSERT INTO VEHICLES (plate_no, vehicle_model, vehicle_type, owner_name, owner_type, citizen_id)
       VALUES (?,?,?,?,?,?)`,
      [plate_no.toUpperCase(), vehicle_model || 'Unknown', vehicle_type || 'Car',
       owner_name || 'Unknown', owner_type || 'Individual', citizen_id || null]
    );
    res.status(201).json({ message: 'Vehicle registered successfully.', plate_no: plate_no.toUpperCase() });
  } catch (err) {
    console.error('Vehicle register error:', err);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// PUT /api/vehicles/:plateNo  — update vehicle details
router.put('/:plateNo', async (req, res) => {
  const plate = req.params.plateNo.toUpperCase();
  const { vehicle_model, vehicle_type, owner_name, owner_type, citizen_id } = req.body;
  try {
    const [result] = await db.execute(
      `UPDATE VEHICLES
       SET vehicle_model = COALESCE(?, vehicle_model),
           vehicle_type  = COALESCE(?, vehicle_type),
           owner_name    = COALESCE(?, owner_name),
           owner_type    = COALESCE(?, owner_type),
           citizen_id    = COALESCE(?, citizen_id)
       WHERE plate_no = ?`,
      [vehicle_model || null, vehicle_type || null, owner_name || null,
       owner_type || null, citizen_id || null, plate]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Vehicle not found.' });
    res.json({ message: 'Vehicle updated successfully.', plate_no: plate });
  } catch (err) {
    console.error('Vehicle update error:', err);
    res.status(500).json({ error: 'Update failed: ' + err.message });
  }
});

// DELETE /api/vehicles/:plateNo
router.delete('/:plateNo', async (req, res) => {
  const plate = req.params.plateNo.toUpperCase();
  try {
    const [result] = await db.execute(`DELETE FROM VEHICLES WHERE plate_no=?`, [plate]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Vehicle not found.' });
    res.json({ message: 'Vehicle removed successfully.' });
  } catch (err) {
    console.error('Vehicle delete error:', err);
    res.status(500).json({ error: 'Delete failed: ' + err.message });
  }
});

// GET /api/vehicles/citizen/:citizenId  — all vehicles owned by a citizen
router.get('/citizen/:citizenId', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT plate_no, vehicle_model, vehicle_type, owner_name, owner_type, registered_at
       FROM VEHICLES WHERE citizen_id = ? ORDER BY registered_at DESC`,
      [req.params.citizenId]
    );
    res.json({ vehicles: rows, count: rows.length });
  } catch (err) {
    console.error('Citizen vehicles error:', err);
    res.status(500).json({ error: 'Failed: ' + err.message });
  }
});

module.exports = router;
