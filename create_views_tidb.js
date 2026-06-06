const mysql = require('mysql2/promise');

async function createViews() {
  const tidb = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
    port: 4000,
    user: '2hbevRqc3LUvTtz.root',
    password: 'XgWwF0qRM47ywFMF',
    database: 'traffic_violation_db',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  const views = [
    `CREATE OR REPLACE VIEW Pending_Reports_Dashboard AS
     SELECT r.report_id, r.date_reported, r.description, r.location_coords, r.location_address, r.plate_no,
            c.citizen_id, c.full_name AS reporter_name, c.trust_score AS reporter_trust_score, c.phone_no AS reporter_phone,
            (SELECT COUNT(*) FROM evidence_photos ep WHERE ep.report_id = r.report_id) AS evidence_count
     FROM reports r JOIN citizens c ON c.citizen_id = r.citizen_id
     WHERE r.status = 'Pending' ORDER BY r.date_reported ASC;`,

    `CREATE OR REPLACE VIEW Citizen_Challan_Summary AS
     SELECT ch.challan_id, ch.citizen_id, ch.total_amount, ch.payment_status, ch.issue_date, ch.due_date,
            ch.paid_at, ch.transaction_ref, vr.rule_name, vr.severity, ve.location_coords,
            po.full_name AS issuing_officer, po.station_code
     FROM challans ch JOIN violation_events ve ON ve.event_id = ch.event_id
     JOIN violation_rules vr ON vr.rule_id = ve.rule_id
     JOIN police_officers po ON po.badge_no = ch.badge_no
     ORDER BY ch.issue_date DESC;`,

    `CREATE OR REPLACE VIEW Officer_Performance_View AS
     SELECT po.badge_no, po.full_name, po.station_code,
            (SELECT COUNT(*) FROM reports r WHERE r.reviewed_by = po.badge_no AND r.status = 'Verified') AS verified_count,
            (SELECT COUNT(*) FROM reports r WHERE r.reviewed_by = po.badge_no AND r.status = 'Rejected') AS rejected_count,
            (SELECT COUNT(*) FROM challans c WHERE c.badge_no = po.badge_no) AS challans_issued,
            (SELECT COALESCE(SUM(c.total_amount), 0) FROM challans c WHERE c.badge_no = po.badge_no AND c.payment_status = 'Paid') AS revenue_collected
     FROM police_officers po WHERE po.is_active = TRUE;`,

    `CREATE OR REPLACE VIEW Citizen_Trust_History AS
     SELECT ch.history_id, ch.citizen_id, c.full_name, ch.trust_score, ch.reward_points, ch.account_status,
            ch.valid_from, ch.valid_to, ch.operation_type, ch.changed_at, ch.changed_by
     FROM citizens_history ch JOIN citizens c ON c.citizen_id = ch.citizen_id
     ORDER BY ch.citizen_id, ch.valid_from;`
  ];

  for (let v of views) {
    console.log('Creating view...');
    await tidb.query(v);
  }

  console.log('Done creating views!');
  tidb.end();
}

createViews().catch(console.error);
