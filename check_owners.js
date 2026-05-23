const db = require('./backend/db');
db.execute("SELECT challan_id, citizen_id FROM CHALLANS WHERE challan_id IN (86,87,92,95)")
  .then(res => console.log(res[0]))
  .catch(console.error)
  .finally(() => process.exit());
