import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function migrate() {
  try {
    console.log('Adding status column to attendees table...');
    await sql`
      ALTER TABLE attendees
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'APPROVED';
    `;
    console.log('Successfully migrated database!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
