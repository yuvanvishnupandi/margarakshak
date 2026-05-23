const db = require('./backend/db');
db.execute("SELECT citizen_id FROM VEHICLES WHERE plate_no='TN02YY2222'")
  .then(res => console.log(res[0]))
  .catch(console.error)
  .finally(() => process.exit());
