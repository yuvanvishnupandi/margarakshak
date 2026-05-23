const mysql = require('mysql2/promise');
require('dotenv').config();

async function setScore() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  try {
    await connection.query('UPDATE CITIZENS SET trust_score = 50 WHERE email = "yuvan.reporter@gmail.com"');
    console.log("Updated to 50");
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

setScore();
