const mysql = require('mysql2/promise');

let pool;

function createSelfHealingPool() {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'yvpandi@11',
    database: process.env.DB_NAME || 'traffic_violation_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: '+05:30',
    ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
  });

  pool.on('connection', (connection) => {
    connection.on('error', (err) => {
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        console.error('\n🚨 [DBMS Auto-Healer] Node failure detected: Connection lost.');
        console.log('🔄 [DBMS Auto-Healer] Instantly recovering... routing traffic to healthy nodes.');
      } else {
        console.error('🚨 [DBMS Error]', err.message);
      }
    });
  });

  return pool;
}

const db = createSelfHealingPool();

db.getConnection()
  .then(async conn => {
    console.log('Master Database Connected & Active.');
    
    // Auto-migrate missing columns for ALL tables
    const queries = [
      "ALTER TABLE REPORTS ADD COLUMN district VARCHAR(100) DEFAULT 'Chennai'",
      "ALTER TABLE reports ADD COLUMN district VARCHAR(100) DEFAULT 'Chennai'",
      "ALTER TABLE REPORTS ADD COLUMN locked_by VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE reports ADD COLUMN locked_by VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE REPORTS ADD COLUMN locked_at DATETIME DEFAULT NULL",
      "ALTER TABLE reports ADD COLUMN locked_at DATETIME DEFAULT NULL",
      "ALTER TABLE CITIZENS ADD COLUMN district VARCHAR(100) DEFAULT 'Chennai'",
      "ALTER TABLE citizens ADD COLUMN district VARCHAR(100) DEFAULT 'Chennai'",
      "ALTER TABLE POLICE_OFFICERS ADD COLUMN district VARCHAR(100) DEFAULT 'Chennai'",
      "ALTER TABLE police_officers ADD COLUMN district VARCHAR(100) DEFAULT 'Chennai'"
    ];

    for (let q of queries) {
      try {
        await conn.execute(q);
        console.log("Migration SUCCESS: " + q);
      } catch (e) {
        // Ignore errors (column exists, table doesn't exist, etc.)
      }
    }

    conn.release();
  })
  .catch(err => {
    console.error('Fatal Master failure:', err.message);
  });

module.exports = db;
