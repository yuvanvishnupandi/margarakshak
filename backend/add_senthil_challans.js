/**
 * Add 2 more overdue challans to Senthil Kumar for demo
 * Run: node add_senthil_challans.js
 */

require('dotenv').config();
const db = require('./db');

async function seed() {
  const conn = await db.getConnection();
  console.log('🔗 Connected to DB');

  try {
    await conn.beginTransaction();

    // ── Get Senthil Kumar's citizen_id ────────────────────────────────
    const [[senthil]] = await conn.execute(
      `SELECT citizen_id FROM CITIZENS WHERE email = 'senthil.kumar@gmail.com' LIMIT 1`
    );
    if (!senthil) { console.error('❌ senthil.kumar@gmail.com not found. Run seed_overdue_demo.js first.'); process.exit(1); }
    const citizenId = senthil.citizen_id;
    console.log(`✅ Found Senthil Kumar → citizen_id: ${citizenId}`);

    // ── Get police officer badge ──────────────────────────────────────
    const [[officer]] = await conn.execute(
      `SELECT badge_no FROM POLICE_OFFICERS WHERE email='ravi.kumar@police.gov.in' LIMIT 1`
    );
    const badgeNo = officer?.badge_no;
    if (!badgeNo) { console.error('❌ Police officer not found'); process.exit(1); }
    console.log(`✅ Police badge: ${badgeNo}`);

    // ── Get 2 different rule_ids ──────────────────────────────────────
    const [rules] = await conn.execute(
      `SELECT rule_id, rule_name, base_fine_amount FROM VIOLATION_RULES LIMIT 5`
    );
    const rule1 = rules[1]; // second rule
    const rule2 = rules[2]; // third rule

    // ── 2 challans with different overdue durations ───────────────────
    // Challan A: 10 days overdue → 20% penalty
    // Challan B: 25 days overdue → 35% penalty
    const challans = [
      {
        label:       'Red Light Jumping',
        plate:       'TN22SK9988',        // Senthil's plate
        ruleId:      rule1.rule_id,
        baseFine:    2000,
        issuedDaysAgo: 30,
        dueDaysAgo:  10,                  // 10 days overdue → 20% = Rs.400
        location:    'Koyambedu, Chennai',
        desc:        'Jumped red signal at busy junction during peak hours'
      },
      {
        label:       'No Insurance',
        plate:       'TN22SK9988',
        ruleId:      rule2.rule_id,
        baseFine:    5000,
        issuedDaysAgo: 45,
        dueDaysAgo:  25,                  // 25 days overdue → 35% = Rs.1750
        location:    'Guindy, Chennai',
        desc:        'Vehicle found without valid third-party insurance certificate'
      }
    ];

    const newChallanIds = [];

    for (const ch of challans) {
      const issueDate = new Date();
      issueDate.setDate(issueDate.getDate() - ch.issuedDaysAgo);

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - ch.dueDaysAgo);

      // Insert report
      const [rpt] = await conn.execute(
        `INSERT INTO REPORTS (citizen_id, plate_no, violation_type, location_address, description, status, date_reported)
         VALUES (?, ?, ?, ?, ?, 'Challan Issued', ?)`,
        [citizenId, ch.plate, ch.label, ch.location, ch.desc, issueDate]
      );
      const reportId = rpt.insertId;

      // Insert violation event (no badge_no column in VIOLATION_EVENTS)
      const [veResult] = await conn.execute(
        `INSERT INTO VIOLATION_EVENTS (report_id, rule_id, plate_no, event_timestamp)
         VALUES (?, ?, ?, ?)`,
        [reportId, ch.ruleId, ch.plate, issueDate]
      );
      const eventId = veResult.insertId;

      // Insert challan
      const [challan] = await conn.execute(
        `INSERT INTO CHALLANS (citizen_id, event_id, badge_no, total_amount, payment_status, issue_date, due_date)
         VALUES (?, ?, ?, ?, 'Unpaid', ?, ?)`,
        [citizenId, eventId, badgeNo, ch.baseFine, issueDate, dueDate]
      );
      const challanId = challan.insertId;
      newChallanIds.push(challanId);

      // Compute penalty for OVERDUE_LOG
      const daysOverdue = ch.dueDaysAgo;
      let latePct = 0;
      if      (daysOverdue <= 3)  latePct = 5;
      else if (daysOverdue <= 7)  latePct = 10;
      else if (daysOverdue <= 15) latePct = 20;
      else if (daysOverdue <= 30) latePct = 35;
      else                        latePct = 50;
      const penalty = parseFloat((ch.baseFine * latePct / 100).toFixed(2));

      // Insert OVERDUE_LOG
      try {
        await conn.execute(
          `INSERT IGNORE INTO OVERDUE_LOG (challan_id, penalty_amount, flagged_at) VALUES (?, ?, NOW())`,
          [challanId, penalty]
        );
      } catch (e) {
        try {
          await conn.execute(
            `INSERT IGNORE INTO OVERDUE_LOG (challan_id, citizen_id, penalty_amount, flagged_at) VALUES (?, ?, ?, NOW())`,
            [challanId, citizenId, penalty]
          );
        } catch (e2) { console.warn('OVERDUE_LOG skip:', e2.message); }
      }

      // Notification
      try {
        await conn.execute(
          `INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message, is_read) VALUES (?, 'Challan Issued', ?, 0)`,
          [citizenId, `OVERDUE: Challan #${challanId} for Rs.${ch.baseFine} (${ch.label}) is overdue by ${daysOverdue} days. Late penalty: ${latePct}% (Rs.${penalty}).`]
        );
      } catch (ne) { /* skip */ }

      console.log(`📋 Challan #${challanId} — ${ch.label} | Rs.${ch.baseFine} | ${daysOverdue} days overdue | ${latePct}% = Rs.${penalty} penalty`);
    }

    await conn.commit();
    conn.release();

    console.log('\n✅ SUCCESS!\n');
    console.log('━'.repeat(55));
    console.log('👤 Senthil Kumar: senthil.kumar@gmail.com | overdue123');
    console.log(`\n   Now has 3 overdue challans:\n`);
    console.log('   Challan 1 → Rs.1500 (No Helmet)     — 2 days overdue  → 5%  = Rs.75');
    console.log(`   Challan 2 → Rs.2000 (Red Light)     — 10 days overdue → 20% = Rs.400`);
    console.log(`   Challan 3 → Rs.5000 (No Insurance)  — 25 days overdue → 35% = Rs.1750`);
    console.log('\n   Challan IDs:', newChallanIds);
    console.log('━'.repeat(55));
    console.log('\n📋 MySQL verification:');
    console.log(`   SELECT ch.challan_id, ch.total_amount, ch.payment_status,`);
    console.log(`          ch.due_date, DATEDIFF(CURDATE(), ch.due_date) AS days_overdue`);
    console.log(`   FROM CHALLANS ch`);
    console.log(`   WHERE ch.citizen_id = ${citizenId}`);
    console.log(`   ORDER BY ch.challan_id;\n`);
    process.exit(0);
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

seed();
