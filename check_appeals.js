const db = require('./backend/db');
(async () => {
  try {
    const [appeals] = await db.execute("SELECT * FROM APPEALS");
    console.log("All Appeals:", appeals);
    const [full] = await db.execute(`
       SELECT a.appeal_id, a.challan_id, a.citizen_id, a.reason,
              a.status, a.created_at,
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
    `);
    console.log("Full Join Result:", full);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
