const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTriggers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  const [triggers] = await connection.execute('SHOW TRIGGERS');
  console.log("Triggers:", JSON.stringify(triggers, null, 2));
  await connection.end();
}

checkTriggers();
