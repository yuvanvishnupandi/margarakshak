const mysql = require('mysql2/promise');

async function migrate() {
  console.log('Connecting to local MySQL...');
  const local = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'yvpandi@11',
    database: 'traffic_violation_db',
    multipleStatements: true
  });

  console.log('Connecting to TiDB Cloud...');
  const tidb = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
    port: 4000,
    user: '2hbevRqc3LUvTtz.root',
    password: 'XgWwF0qRM47ywFMF',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  await tidb.query('CREATE DATABASE IF NOT EXISTS traffic_violation_db');
  await tidb.query('USE traffic_violation_db');
  
  // Disable strict mode and foreign key checks temporarily
  await tidb.query("SET sql_mode = ''");
  await tidb.query('SET FOREIGN_KEY_CHECKS=0');

  const [tables] = await local.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  const tableNames = tables.map(t => Object.values(t)[0]);

  for (const table of tableNames) {
    console.log(`Migrating table: ${table}...`);
    const [[createTable]] = await local.query(`SHOW CREATE TABLE ${table}`);
    let ddl = createTable['Create Table'];
    // TiDB fixes: remove COLLATE and ENGINE if it causes issues, but usually fine.
    // Drop table if exists
    await tidb.query(`DROP TABLE IF EXISTS ${table}`);
    await tidb.query(ddl);

    const [rows] = await local.query(`SELECT * FROM ${table}`);
    if (rows.length > 0) {
      console.log(`  -> Inserting ${rows.length} rows into ${table}...`);
      // Bulk insert
      const keys = Object.keys(rows[0]);
      const columns = keys.map(k => `\`${k}\``).join(', ');
      
      // Batch insert in chunks of 500
      const chunkSize = 500;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const values = [];
        const flatData = [];
        for (const row of chunk) {
          const rowVals = keys.map(k => {
            let val = row[k];
            if (val === '') return null;
            if (val instanceof Date) return val;
            return val;
          });
          values.push(`(${keys.map(() => '?').join(', ')})`);
          flatData.push(...rowVals);
        }
        const insertSql = `INSERT INTO \`${table}\` (${columns}) VALUES ${values.join(', ')}`;
        await tidb.query(insertSql, flatData);
      }
    }
  }

  // Handle routines (Procedures, Functions, Triggers)
  console.log('Migrating routines/triggers...');
  try {
    const [triggers] = await local.query('SHOW TRIGGERS');
    for (const trig of triggers) {
      console.log(`  -> Creating trigger ${trig.Trigger}`);
      const [[createTrig]] = await local.query(`SHOW CREATE TRIGGER ${trig.Trigger}`);
      await tidb.query(`DROP TRIGGER IF EXISTS ${trig.Trigger}`);
      
      // Some MySQL specific DEFINER syntax might fail in TiDB, replace it
      let trigSQL = createTrig['SQL Original Statement'] || createTrig['Create Trigger'];
      trigSQL = trigSQL.replace(/DEFINER=`.*?`@`.*?`/g, '');
      await tidb.query(trigSQL).catch(e => console.error(`    Skipping trigger ${trig.Trigger} due to TiDB syntax limits:`, e.message));
    }
  } catch(e) {
    console.log('Could not migrate triggers:', e.message);
  }

  await tidb.query('SET FOREIGN_KEY_CHECKS=1');

  console.log('Migration complete!');
  local.end();
  tidb.end();
}

migrate().catch(console.error);
