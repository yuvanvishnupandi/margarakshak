require('dotenv').config();
const db = require('./db');
async function check() {
  const [ve] = await db.execute(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='VIOLATION_EVENTS' ORDER BY ORDINAL_POSITION`);
  console.log('VIOLATION_EVENTS cols:', ve.map(c=>c.COLUMN_NAME).join(', '));
  const [ch] = await db.execute(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='CHALLANS' ORDER BY ORDINAL_POSITION`);
  console.log('CHALLANS cols:', ch.map(c=>c.COLUMN_NAME).join(', '));
  process.exit(0);
}
check().catch(e=>{console.error(e.message);process.exit(1);});
