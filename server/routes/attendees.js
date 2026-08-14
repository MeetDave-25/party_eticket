import { Router } from 'express';
import sql from '../db.js';

const router = Router();

// ─── helpers ───────────────────────────────────────────────────
function generateCode(tier = 'GEN') {
  const prefix = tier.substring(0, 3).toUpperCase();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `PASS-${prefix}-${num}`;
}
function generateId() {
  return `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}
// Map snake_case DB row → camelCase JS object
function rowToAttendee(row) {
  if (!row) return null;
  return {
    id:          row.id,
    code:        row.code,
    name:        row.name,
    email:       row.email || '',
    phone:       row.phone || '',
    tier:        row.tier,
    seat:        row.seat || '',
    company:     row.company || '',
    notes:       row.notes || '',
    checkedIn:   row.checked_in,
    checkedInAt: row.checked_in_at ? row.checked_in_at.toISOString() : null,
    checkedInBy: row.checked_in_by || null,
    createdAt:   row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
  };
}

// ─── GET /api/attendees ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM attendees ORDER BY created_at DESC
    `;
    res.json(rows.map(rowToAttendee));
  } catch (err) {
    console.error('GET /attendees error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/attendees/find/:query ────────────────────────────
router.get('/find/:query', async (req, res) => {
  const q = req.params.query.trim();
  try {
    const rows = await sql`
      SELECT * FROM attendees
      WHERE
        id = ${q}
        OR UPPER(code) = UPPER(${q})
        OR LOWER(email) = LOWER(${q})
        OR phone = ${q}
        OR REPLACE(phone, '-', '') = REPLACE(${q}, '-', '')
      LIMIT 1
    `;
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rowToAttendee(rows[0]));
  } catch (err) {
    console.error('GET /attendees/find error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/attendees/:id ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM attendees WHERE id = ${req.params.id} LIMIT 1
    `;
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rowToAttendee(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/attendees ────────────────────────────────────────
router.post('/', async (req, res) => {
  const body = req.body;
  if (!body.name?.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  const id   = body.id   || generateId();
  const code = (body.code || generateCode(body.tier || 'GEN')).toUpperCase();

  try {
    const rows = await sql`
      INSERT INTO attendees
        (id, code, name, email, phone, tier, seat, company, notes)
      VALUES
        (${id}, ${code}, ${body.name.trim()},
         ${body.email?.trim().toLowerCase() || null},
         ${body.phone?.trim() || null},
         ${body.tier || 'GENERAL'},
         ${body.seat || null},
         ${body.company || null},
         ${body.notes || null})
      RETURNING *
    `;
    res.status(201).json(rowToAttendee(rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      // unique violation on code — retry with new code
      const newCode = generateCode(body.tier || 'GEN');
      const retry = await sql`
        INSERT INTO attendees
          (id, code, name, email, phone, tier, seat, company, notes)
        VALUES
          (${id}, ${newCode}, ${body.name.trim()},
           ${body.email?.trim().toLowerCase() || null},
           ${body.phone?.trim() || null},
           ${body.tier || 'GENERAL'},
           ${body.seat || null},
           ${body.company || null},
           ${body.notes || null})
        RETURNING *
      `;
      return res.status(201).json(rowToAttendee(retry[0]));
    }
    console.error('POST /attendees error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/attendees/:id ─────────────────────────────────────
router.put('/:id', async (req, res) => {
  const body = req.body;
  try {
    const rows = await sql`
      UPDATE attendees SET
        name          = COALESCE(${body.name || null},          name),
        email         = COALESCE(${body.email || null},         email),
        phone         = COALESCE(${body.phone || null},         phone),
        tier          = COALESCE(${body.tier || null},          tier),
        seat          = COALESCE(${body.seat || null},          seat),
        company       = COALESCE(${body.company || null},       company),
        notes         = COALESCE(${body.notes || null},         notes),
        checked_in    = COALESCE(${body.checkedIn ?? null},     checked_in),
        checked_in_at = COALESCE(${body.checkedInAt ? new Date(body.checkedInAt) : null}, checked_in_at),
        checked_in_by = COALESCE(${body.checkedInBy || null},  checked_in_by)
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rowToAttendee(rows[0]));
  } catch (err) {
    console.error('PUT /attendees error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/attendees/:id ──────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await sql`DELETE FROM attendees WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
