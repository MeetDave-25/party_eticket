import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

// Single connection pool shared across all routes
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 10,               // max pool connections
  idle_timeout: 30,
  connect_timeout: 10,
  onnotice: () => {},    // suppress notices
});

export default sql;
