import sql from './server/db.js';

async function wipe() {
  await sql`TRUNCATE attendees, scan_logs`;
  console.log('Database wiped for real-life mode.');
  process.exit(0);
}

wipe();
