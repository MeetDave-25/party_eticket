import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sql from './db.js';
import attendeesRouter from './routes/attendees.js';
import scannerRouter from './routes/scanner.js';
import seedRouter from './routes/seed.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Request logger (dev) ───────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`  ${req.method} ${req.path}`);
  next();
});

// ─── Auto-run schema on startup ─────────────────────────────────
async function runSchema() {
  try {
    const schemaPath = join(__dirname, 'schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    await sql.unsafe(schemaSql);
    console.log('✅ Schema verified (tables ready)');
  } catch (err) {
    console.error('❌ Schema error:', err.message);
    process.exit(1);
  }
}

// ─── Routes ────────────────────────────────────────────────────
app.use('/api/attendees', attendeesRouter);
app.use('/api/scan',      scannerRouter);
app.use('/api/seed',      seedRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Serve Frontend in Production ──────────────────────────────
const distPath = join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback for SPA routing (any non-API route goes to index.html)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// ─── Start ─────────────────────────────────────────────────────
async function start() {
  await runSchema();

  app.listen(PORT, () => {
    console.log('');
    console.log('┌─────────────────────────────────────────┐');
    console.log(`│   PassGuard API  →  http://localhost:${PORT}  │`);
    console.log('│   Neon PostgreSQL connected ✓            │');
    console.log('└─────────────────────────────────────────┘');
    console.log('');
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
