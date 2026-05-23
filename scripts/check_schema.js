const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost', user: 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'traffic_violation',
});

async function run() {
  const conn = await pool.getConnection();
  try {
    // Check trg_report_notification trigger body
    const [triggers] = await conn.query(`
      SELECT TRIGGER_NAME, ACTION_STATEMENT
      FROM INFORMATION_SCHEMA.TRIGGERS
      WHERE TRIGGER_SCHEMA = DATABASE()
        AND TRIGGER_NAME = 'trg_report_notification'
    `);
    if (triggers.length) {
      console.log('trg_report_notification ACTION_STATEMENT:');
      console.log(triggers[0].ACTION_STATEMENT);
    } else {
      console.log('Trigger trg_report_notification not found');
    }

    // Check NOTIFICATIONS table structure
    const [notifCols] = await conn.query('DESCRIBE notifications');
    console.log('\n📋 notifications columns:');
    notifCols.forEach(c => console.log(` - ${c.Field} | ${c.Type} | Null:${c.Null} | Key:${c.Key} | Default:${c.Default}`));

    // Check pending reports to confirm challan can be issued
    const [pending] = await conn.query(`
      SELECT r.report_id, r.plate_no, r.status, r.citizen_id,
             c.full_name, c.trust_score
      FROM reports r
      JOIN citizens c ON r.citizen_id = c.citizen_id
      WHERE r.status = 'Pending'
      ORDER BY r.report_id DESC
      LIMIT 5
    `);
    console.log('\n📄 Pending reports (latest 5):');
    console.table(pending);

  } finally {
    conn.release();
    await pool.end();
  }
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });
