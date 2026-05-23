const db = require('./backend/db');
db.execute("SELECT * FROM CHALLANS WHERE challan_id=97")
  .then(res => {
     console.log("CHALLAN 97:", res[0]);
     return db.execute("SELECT * FROM VIOLATION_EVENTS WHERE event_id=" + (res[0][0]?.event_id || 0));
  })
  .then(res => {
     console.log("EVENT:", res[0]);
     return db.execute("SELECT * FROM REPORTS WHERE report_id=" + (res[0][0]?.report_id || 0));
  })
  .then(res => {
     console.log("REPORT:", res[0]);
  })
  .catch(console.error)
  .finally(() => process.exit());
