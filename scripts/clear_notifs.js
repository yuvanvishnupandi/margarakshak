const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost', user: 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'traffic_violation',
});
pool.getConnection().then(async conn => {
  const [r] = await conn.query(
    "DELETE FROM notifications WHERE message LIKE '%reports_submitted%' OR message LIKE '%Unknown column%'"
  );
  console.log('Deleted stale error notifications:', r.affectedRows);
  conn.release();
  await pool.end();
}).catch(e => { console.error(e.message); process.exit(1); });
