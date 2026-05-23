const db = require('./backend/db');
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

(async () => {
  try {
    const citizenId = 15;
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
    console.log(`Challans for citizen 15:`, rows.length);
    if(rows.length > 0) {
      console.log('Sample:', rows[0]);
    }
    
    // Check if fetchChallans throws or something.
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
