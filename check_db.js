const db = require('./backend/db');
(async () => {
  try {
    const [cit] = await db.execute("SELECT citizen_id, email, full_name FROM CITIZENS WHERE email = 'pandiyuvan@gmail.com'");
    console.log('Citizen:', cit);
    if(cit.length) {
      const [veh] = await db.execute("SELECT * FROM VEHICLES WHERE citizen_id = ?", [cit[0].citizen_id]);
      console.log('Vehicles for citizen:', veh);
      
      const [vehPlate] = await db.execute("SELECT * FROM VEHICLES WHERE plate_no = 'TN02YY2222'");
      console.log('Vehicle with plate TN02YY2222:', vehPlate);
    }
    const [chal] = await db.execute("SELECT c.challan_id, c.citizen_id, ve.plate_no FROM CHALLANS c JOIN VIOLATION_EVENTS ve ON c.event_id = ve.event_id");
    console.log('All Challans:', chal);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
