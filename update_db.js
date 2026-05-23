const db = require('./backend/db');
(async () => {
  try {
    await db.execute("UPDATE VEHICLES SET citizen_id = 15 WHERE plate_no = 'TN02YY2222'");
    await db.execute("UPDATE CHALLANS c JOIN VIOLATION_EVENTS ve ON c.event_id = ve.event_id SET c.citizen_id = 15 WHERE ve.plate_no = 'TN02YY2222'");
    console.log('Fixed DB ownership for TN02YY2222');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
