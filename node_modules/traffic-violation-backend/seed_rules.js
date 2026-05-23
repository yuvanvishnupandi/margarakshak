/**
 * seed_rules.js
 * Run: node seed_rules.js
 * Inserts 20 additional real MV Act traffic rules (skips duplicates by rule_code).
 */
const db = require('./db');

const newRules = [
  { rule_code: 'TRP-012', rule_name: 'Triple Riding', description: 'More than two persons riding on a two-wheeler, violating MV Act Sec 128.', base_fine_amount: 1000, severity: 'Moderate', violation_time: 'Anytime' },
  { rule_code: 'RCE-013', rule_name: 'Racing / Reckless Driving', description: 'Participating in unauthorised racing or reckless driving on public road — MV Act Sec 189.', base_fine_amount: 5000, severity: 'Critical', violation_time: 'Anytime' },
  { rule_code: 'NPK-014', rule_name: 'Parking in No-Parking Zone', description: 'Parking vehicle in designated no-parking zone or on yellow-line markings.', base_fine_amount: 500, severity: 'Minor', violation_time: 'Anytime' },
  { rule_code: 'OVS-015', rule_name: 'Overspeeding in School Zone', description: 'Exceeding speed limit of 25 km/h in marked school/hospital zones — MV Act Sec 112.', base_fine_amount: 3000, severity: 'Major', violation_time: 'Anytime' },
  { rule_code: 'JMP-016', rule_name: 'Jumping Signal / Stop Line', description: 'Crossing stop-line or signal before it turns green — MV Act Sec 119.', base_fine_amount: 1000, severity: 'Moderate', violation_time: 'Anytime' },
  { rule_code: 'NFI-017', rule_name: 'No Fitness Certificate', description: 'Operating a vehicle without a valid fitness certificate — MV Act Sec 56.', base_fine_amount: 2000, severity: 'Major', violation_time: 'Anytime' },
  { rule_code: 'NRC-018', rule_name: 'No Registration Certificate', description: 'Driving an unregistered or unlicensed vehicle on public road — MV Act Sec 39.', base_fine_amount: 2000, severity: 'Major', violation_time: 'Anytime' },
  { rule_code: 'NPC-019', rule_name: 'No Pollution Under Control (PUC)', description: 'Vehicle without valid Pollution Under Control certificate — MV Act Sec 190(2).', base_fine_amount: 1000, severity: 'Moderate', violation_time: 'Anytime' },
  { rule_code: 'HZD-020', rule_name: 'Improper Hazardous Goods Transport', description: 'Transporting hazardous material without proper permits, placards or protective gear.', base_fine_amount: 3000, severity: 'Major', violation_time: 'Anytime' },
  { rule_code: 'USR-021', rule_name: 'Unauthorised Modification', description: 'Structural or mechanical alteration of vehicle without RTO approval — MV Act Sec 52.', base_fine_amount: 5000, severity: 'Critical', violation_time: 'Anytime' },
  { rule_code: 'FHD-022', rule_name: 'Using High Beam in City', description: 'Using high-beam headlights within city limits or in the presence of oncoming traffic.', base_fine_amount: 500, severity: 'Minor', violation_time: 'Anytime' },
  { rule_code: 'CRS-023', rule_name: 'Dangerous / Cutthroat Overtaking', description: 'Overtaking on a bend, crest, intersection or solid yellow line — MV Act Sec 126.', base_fine_amount: 2000, severity: 'Major', violation_time: 'Anytime' },
  { rule_code: 'MNR-024', rule_name: 'Minor Driving Vehicle', description: 'Person below 18 years of age operating a motor vehicle — MV Act Sec 4 / Sec 199A.', base_fine_amount: 25000, severity: 'Critical', violation_time: 'Anytime' },
  { rule_code: 'EMG-025', rule_name: 'Blocking Emergency Vehicle', description: 'Failing to yield to ambulance, fire engine or police vehicle with active siren.', base_fine_amount: 10000, severity: 'Critical', violation_time: 'Anytime' },
  { rule_code: 'ZBR-026', rule_name: 'Not Stopping at Zebra Crossing', description: 'Failure to stop for pedestrians at a marked zebra crossing — MV Act Sec 15.', base_fine_amount: 1000, severity: 'Moderate', violation_time: 'Anytime' },
  { rule_code: 'RVS-027', rule_name: 'Reversing on Highway / Main Road', description: 'Reversing a vehicle on a national or state highway, posing accident risk.', base_fine_amount: 2000, severity: 'Major', violation_time: 'Anytime' },
  { rule_code: 'LNE-028', rule_name: 'Lane Cutting / Indiscipline', description: 'Crossing solid lane markings, weaving between lanes or not following lane discipline.', base_fine_amount: 500, severity: 'Minor', violation_time: 'Anytime' },
  { rule_code: 'TMP-029', rule_name: 'Using Fake / Tampered Number Plate', description: 'Operating a vehicle with non-standard, missing, obscured or fake number plates — MV Act Sec 41.', base_fine_amount: 5000, severity: 'Critical', violation_time: 'Anytime' },
  { rule_code: 'ROA-030', rule_name: 'Driving Under Fatigue / 8-Hr Limit', description: 'Commercial vehicle driver operating beyond 8-hour continuous driving limit — MV Act Sec 93.', base_fine_amount: 2000, severity: 'Major', violation_time: 'Anytime' },
  { rule_code: 'SPD-031', rule_name: 'Excessive Speed — Heavy Vehicle', description: 'Truck, bus or heavy vehicle exceeding 60 km/h on national highway or city speed limit.', base_fine_amount: 4000, severity: 'Major', violation_time: 'Anytime' },
];

async function seed() {
  let inserted = 0;
  let skipped = 0;

  for (const r of newRules) {
    const [[exists]] = await db.execute(
      'SELECT rule_id FROM VIOLATION_RULES WHERE rule_code = ?', [r.rule_code]
    );
    if (exists) { console.log(`⏭  Skipped (exists): ${r.rule_code}`); skipped++; continue; }

    await db.execute(
      `INSERT INTO VIOLATION_RULES (rule_code, rule_name, description, base_fine_amount, severity, violation_time, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [r.rule_code, r.rule_name, r.description, r.base_fine_amount, r.severity, r.violation_time]
    );
    console.log(`✅ Inserted: ${r.rule_code} — ${r.rule_name}`);
    inserted++;
  }

  console.log(`\nDone. Inserted: ${inserted}  Skipped: ${skipped}`);
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
