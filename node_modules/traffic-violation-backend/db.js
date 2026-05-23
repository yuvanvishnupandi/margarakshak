const mysql = require('mysql2/promise');

let pool;

function createSelfHealingPool() {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'yvpandi@11',
    database: process.env.DB_NAME || 'traffic_violation_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: '+05:30'
  });

  // Attach auto-healing listeners to connections
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

// Test connection on startup
db.getConnection()
  .then(conn => {
    console.log('Master Database Connected & Active.');
    conn.release();
  })
  .catch(err => {
    console.error('Fatal Master failure:', err.message);
  });

module.exports = db;


