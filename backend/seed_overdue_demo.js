/**
 * MARGA RAKSHAK — Demo Seed: Overdue Challans
 * Run: node seed_overdue_demo.js
 * 
 * Creates:
 *  - 3 citizen accounts with OVERDUE challans (visible in Ravi Kumar's police portal)
 *  - Each citizen has a different violation and overdue duration
 *  - OVERDUE_LOG entries so they show in police dashboard immediately
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const BADGE_NO = 'POL-101'; // Ravi Kumar's badge

async function seed() {
  const conn = await db.getConnection();
  console.log('🔗 Connected to DB:', process.env.DB_NAME);

  try {
    await conn.beginTransaction();

    // ── Step 1: Ensure violation rules exist ──────────────────────────────
    const [existingRules] = await conn.execute(
      `SELECT rule_id, rule_code FROM VIOLATION_RULES LIMIT 10`
    );
    console.log(`✅ Found ${existingRules.length} violation rules`);

    // Pick 3 rule_ids to use (or use whichever exist)
    let ruleIds = existingRules.map(r => r.rule_id);
    if (ruleIds.length < 3) {
      console.error('❌ Need at least 3 violation rules in DB. Run schema.sql first.');
      process.exit(1);
    }
    const [r1, r2, r3] = ruleIds;

    // ── Step 1B: Ensure police officer exists, get their badge_no ──────────
    let actualBadgeNo = BADGE_NO;
    const [[existingOfficer]] = await conn.execute(
      `SELECT badge_no FROM POLICE_OFFICERS WHERE email='ravi.kumar@police.gov.in' OR badge_no=? LIMIT 1`, [BADGE_NO]
    );
    if (!existingOfficer) {
      const policePass = await bcrypt.hash('police123', 10);
      await conn.execute(
        `INSERT INTO POLICE_OFFICERS (badge_no, full_name, email, phone_no, password_hash, officer_rank, station_code, is_active)
         VALUES (?, 'Ravi Kumar', 'ravi.kumar@police.gov.in', '9876543210', ?, 'Inspector', 'STATION-001', 1)`,
        [BADGE_NO, policePass]
      );
      console.log('🚔 Created police officer: Ravi Kumar (POL-101)');
    } else {
      actualBadgeNo = existingOfficer.badge_no;
      console.log(`🚔 Police officer exists: ${actualBadgeNo}`);
    }

    // ── Step 2: Create 3 citizen accounts ────────────────────────────────
    const pass = await bcrypt.hash('overdue123', 10);
    const citizens = [
      { name: 'Muthu Selvam',   email: 'muthu.selvam@gmail.com',   phone: '9876500001', plate: 'TN07MK3341' },
      { name: 'Kavitha Devi',   email: 'kavitha.devi@gmail.com',   phone: '9876500002', plate: 'TN11KD7722' },
      { name: 'Senthil Kumar',  email: 'senthil.kumar@gmail.com',  phone: '9876500003', plate: 'TN22SK9988' },
    ];

    const citizenIds = [];
    for (const c of citizens) {
      // Delete if exists
      await conn.execute(`DELETE FROM CITIZENS WHERE email=?`, [c.email]);
      const [result] = await conn.execute(
        `INSERT INTO CITIZENS (full_name, email, phone_no, password_hash, trust_score, reward_points, account_status)
         VALUES (?, ?, ?, ?, 45, 0, 'Active')`,
        [c.name, c.email, c.phone, pass]
      );
      citizenIds.push(result.insertId);
      console.log(`👤 Created citizen: ${c.name} (id=${result.insertId})`);
    }

    // ── Step 4: Register their vehicles ──────────────────────────────────
    for (let i = 0; i < citizens.length; i++) {
      await conn.execute(
        `INSERT IGNORE INTO VEHICLES (plate_no, vehicle_model, vehicle_type, owner_name, owner_type, citizen_id)
         VALUES (?, ?, 'Car', ?, 'Individual', ?)`,
        [citizens[i].plate, ['Honda City', 'Maruti Swift', 'Hyundai i20'][i], citizens[i].name, citizenIds[i]]
      );
    }

    // ── Step 5: Create reports, violation events, challans ───────────────
    // Overdue durations: 30, 20, 10 days ago (all past due)
    const issuedDaysAgo  = [30, 20, 10];
    const dueDaysAgo     = [15,  5,  2]; // all past due → overdue
    const baseFines      = [500, 1000, 1500];
    const locations      = ['Anna Salai, Chennai', 'T. Nagar, Chennai', 'Velachery, Chennai'];

    const challanIds = [];
    for (let i = 0; i < 3; i++) {
      const issueDate = new Date();
      issueDate.setDate(issueDate.getDate() - issuedDaysAgo[i]);

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - dueDaysAgo[i]); // past = overdue

      // Insert report
      const [rpt] = await conn.execute(
        `INSERT INTO REPORTS (citizen_id, plate_no, violation_type, location_address, description, status, date_reported)
         VALUES (?, ?, ?, ?, ?, 'Challan Issued', ?)`,
        [
          citizenIds[i], citizens[i].plate,
          ['Overspeeding', 'Red Light Jump', 'No Helmet'][i],
          locations[i],
          ['Detected speeding at 80 km/h in 40 zone', 'Jumped red light at junction', 'Riding without helmet'][i],
          issueDate
        ]
      );
      const reportId = rpt.insertId;

      // Insert violation event (need badge_no + plate_no)
      const [[veRule]] = await conn.execute(
        `SELECT rule_id FROM VIOLATION_RULES WHERE rule_id=? LIMIT 1`, [[r1, r2, r3][i]]
      );
      const ruleId = veRule?.rule_id || ruleIds[i];

      // Check if VIOLATION_EVENTS has plate_no column
      const [veColumns] = await conn.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='VIOLATION_EVENTS'`
      );
      const veCols = veColumns.map(c => c.COLUMN_NAME);
      const hasPlate = veCols.includes('plate_no');
      const hasBadge = veCols.includes('badge_no');

      let veResult;
      if (hasPlate && hasBadge) {
        [veResult] = await conn.execute(
          `INSERT INTO VIOLATION_EVENTS (report_id, badge_no, rule_id, plate_no, event_timestamp)
           VALUES (?, ?, ?, ?, ?)`,
          [reportId, actualBadgeNo, ruleId, citizens[i].plate, issueDate]
        );
      } else if (hasBadge) {
        [veResult] = await conn.execute(
          `INSERT INTO VIOLATION_EVENTS (report_id, badge_no, rule_id, event_timestamp)
           VALUES (?, ?, ?, ?)`,
          [reportId, actualBadgeNo, ruleId, issueDate]
        );
      } else {
        [veResult] = await conn.execute(
          `INSERT INTO VIOLATION_EVENTS (report_id, rule_id, event_timestamp)
           VALUES (?, ?, ?)`,
          [reportId, ruleId, issueDate]
        );
      }
      const eventId = veResult.insertId;

      // Insert challan (UNPAID, past due_date → overdue)
      const [ch] = await conn.execute(
        `INSERT INTO CHALLANS (citizen_id, event_id, badge_no, total_amount, payment_status, issue_date, due_date)
         VALUES (?, ?, ?, ?, 'Unpaid', ?, ?)`,
        [citizenIds[i], eventId, actualBadgeNo, baseFines[i], issueDate, dueDate]
      );
      challanIds.push(ch.insertId);
      console.log(`📋 Created overdue challan #${ch.insertId} for ${citizens[i].name} — Rs.${baseFines[i]} (due ${dueDaysAgo[i]} days ago)`);
    }

    // ── Step 6: Populate OVERDUE_LOG ─────────────────────────────────────
    // Penalty: 15% of base fine
    for (let i = 0; i < challanIds.length; i++) {
      const penalty = parseFloat((baseFines[i] * 0.15).toFixed(2));
      try {
        await conn.execute(
          `INSERT IGNORE INTO OVERDUE_LOG (challan_id, penalty_amount, flagged_at)
           VALUES (?, ?, NOW())`,
          [challanIds[i], penalty]
        );
        console.log(`⚠️  Added OVERDUE_LOG entry: challan #${challanIds[i]}, penalty Rs.${penalty}`);
      } catch (e) {
        // Try with citizen_id column if schema requires it
        try {
          await conn.execute(
            `INSERT IGNORE INTO OVERDUE_LOG (challan_id, citizen_id, penalty_amount, flagged_at)
             VALUES (?, ?, ?, NOW())`,
            [challanIds[i], citizenIds[i], penalty]
          );
          console.log(`⚠️  Added OVERDUE_LOG (with citizen): challan #${challanIds[i]}`);
        } catch (e2) {
          console.warn('⚠️  OVERDUE_LOG insert skipped:', e2.message);
        }
      }
    }

    // ── Step 7: Send notifications to citizens ────────────────────────────
    for (let i = 0; i < 3; i++) {
      try {
        await conn.execute(
          `INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message, is_read)
           VALUES (?, 'Challan Issued', ?, 0)`,
          [
            citizenIds[i],
            `OVERDUE NOTICE: Your challan #${challanIds[i]} for Rs.${baseFines[i]} is overdue by ${dueDaysAgo[i]} days. A late fee of 0.5%/day applies. Pay immediately to avoid further penalties.`
          ]
        );
      } catch (ne) { console.warn('Notify skip:', ne.message); }
    }

    await conn.commit();
    conn.release();

    console.log('\n✅ SEED COMPLETE!\n');
    console.log('━'.repeat(55));
    console.log('🚔 POLICE LOGIN (already exists):');
    console.log('   Email:    ravi.kumar@police.gov.in');
    console.log('   Password: police123');
    console.log('   → Go to Overdue Log to see 3 overdue citizens\n');
    console.log('👤 CITIZEN LOGINS (overdue challans):');
    console.log('   1. muthu.selvam@gmail.com   | overdue123 | Rs.500  (30 days overdue)');
    console.log('   2. kavitha.devi@gmail.com   | overdue123 | Rs.1000 (20 days overdue)');
    console.log('   3. senthil.kumar@gmail.com  | overdue123 | Rs.1500 (10 days overdue)');
    console.log('━'.repeat(55));
    console.log('\n💡 When citizen logs in and pays → late fee auto-calculated:');
    console.log('   Muthu:   Rs.500  + ~75 late fee  = ~Rs.575');
    console.log('   Kavitha: Rs.1000 + ~100 late fee = ~Rs.1100');
    console.log('   Senthil: Rs.1500 + ~75 late fee  = ~Rs.1575');
    console.log('\n   (0.5% per overdue day, capped at 50%)\n');
    process.exit(0);
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

seed();
