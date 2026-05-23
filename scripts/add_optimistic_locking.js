const db = require('../backend/db');

async function main() {
  try {
    console.log("Adding version column to REPORTS table for Optimistic Locking...");
    
    // Add column. MySQL < 8 doesn't support 'IF NOT EXISTS' for columns easily, so we catch the error if it exists.
    try {
      await db.execute(`ALTER TABLE REPORTS ADD COLUMN version INT DEFAULT 1;`);
      console.log("Successfully added 'version' column.");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("'version' column already exists.");
      } else {
        throw err;
      }
    }
    
    console.log("Optimistic Locking Database Schema Update Complete.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
