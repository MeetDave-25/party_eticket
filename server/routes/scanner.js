import { Router } from 'express';
import sql from '../db.js';

const router = Router();

// ─── helpers ───────────────────────────────────────────────────
function generateLogId() {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
}
function rowToLog(row) {
  if (!row) return null;
  return {
    id:            row.id,
    ticketCode:    row.ticket_code,
    attendeeId:    row.attendee_id,
    attendeeName:  row.attendee_name,
    attendeeTier:  row.attendee_tier,
    status:        row.status,
    message:       row.message,
    gateLocation:  row.gate_location,
    device:        row.device,
    timestamp:     row.timestamp ? row.timestamp.toISOString() : new Date().toISOString(),
  };
}

// ─── POST /api/scan/verify ──────────────────────────────────────
// The core one-time verification engine — runs server-side so it's atomic
router.post('/verify', async (req, res) => {
  const { identifier, gateLocation = 'Gate Alpha', device = 'Web Scanner' } = req.body;

  if (!identifier?.trim()) {
    const log = await insertLog({ status: 'INVALID', ticketCode: 'UNKNOWN', attendeeName: 'Empty QR', message: 'Empty or unreadable QR payload', gateLocation, device });
    return res.json({ status: 'INVALID', message: 'Empty or unreadable QR code', log });
  }

  const clean = identifier.trim().toUpperCase();

  try {
    // Use a transaction to make the check-in atomic (prevents race conditions)
    const result = await sql.begin(async (sql) => {

      // Look up by code or id
      const rows = await sql`
        SELECT * FROM attendees
        WHERE UPPER(code) = ${clean} OR UPPER(id) = ${clean}
        LIMIT 1
        FOR UPDATE
      `;

      // ── INVALID ──────────────────────────────────────────────
      if (rows.length === 0) {
        const log = await insertLog({ status: 'INVALID', ticketCode: clean, attendeeName: 'Unregistered / Fake Pass', message: `Code "${clean}" not found in registered database`, gateLocation, device }, sql);
        return { status: 'INVALID', ticketCode: clean, message: `Invalid Pass: Code "${clean}" is not registered.`, log };
      }

      const attendee = rows[0];

      // ── DUPLICATE ─────────────────────────────────────────────
      if (attendee.checked_in) {
        const log = await insertLog({
          status: 'DUPLICATE', ticketCode: attendee.code,
          attendeeId: attendee.id, attendeeName: attendee.name, attendeeTier: attendee.tier,
          message: `Already checked in at ${attendee.checked_in_at}`, gateLocation, device
        }, sql);
        return {
          status: 'DUPLICATE',
          attendee: rowToAttendee(attendee),
          ticketCode: attendee.code,
          firstCheckedInAt: attendee.checked_in_at ? attendee.checked_in_at.toISOString() : null,
          checkedInBy: attendee.checked_in_by || 'Gate Scanner',
          message: `DUPLICATE: Pass already scanned at ${new Date(attendee.checked_in_at).toLocaleString()}`,
          log
        };
      }

      // ── SUCCESS ───────────────────────────────────────────────
      const now = new Date();
      const updated = await sql`
        UPDATE attendees
        SET checked_in = true, checked_in_at = ${now}, checked_in_by = ${gateLocation}
        WHERE id = ${attendee.id}
        RETURNING *
      `;
      const log = await insertLog({
        status: 'SUCCESS', ticketCode: attendee.code,
        attendeeId: attendee.id, attendeeName: attendee.name, attendeeTier: attendee.tier,
        message: `Entry granted for ${attendee.name} (${attendee.tier})`, gateLocation, device
      }, sql);
      return {
        status: 'SUCCESS',
        attendee: rowToAttendee(updated[0]),
        ticketCode: attendee.code,
        checkedInAt: now.toISOString(),
        message: `ENTRY GRANTED: ${attendee.name} successfully verified.`,
        log
      };
    });

    res.json(result);
  } catch (err) {
    console.error('POST /scan/verify error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/scan/undo ────────────────────────────────────────
router.post('/undo', async (req, res) => {
  const { attendeeId } = req.body;
  try {
    const rows = await sql`
      UPDATE attendees
      SET checked_in = false, checked_in_at = null, checked_in_by = null
      WHERE id = ${attendeeId}
      RETURNING *
    `;
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rowToAttendee(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/scan/logs ─────────────────────────────────────────
router.get('/logs', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM scan_logs ORDER BY timestamp DESC LIMIT 500
    `;
    res.json(rows.map(rowToLog));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/scan/logs ──────────────────────────────────────
router.delete('/logs', async (req, res) => {
  try {
    await sql`TRUNCATE scan_logs`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── helper functions ───────────────────────────────────────────
async function insertLog({ status, ticketCode, attendeeId = null, attendeeName = null, attendeeTier = null, message = '', gateLocation = 'Gate Alpha', device = 'Scanner' }, sqlClient = sql) {
  const id = generateLogId();
  const rows = await sqlClient`
    INSERT INTO scan_logs (id, ticket_code, attendee_id, attendee_name, attendee_tier, status, message, gate_location, device)
    VALUES (${id}, ${ticketCode}, ${attendeeId}, ${attendeeName}, ${attendeeTier}, ${status}, ${message}, ${gateLocation}, ${device})
    RETURNING *
  `;
  return rowToLog(rows[0]);
}

function rowToAttendee(row) {
  if (!row) return null;
  return {
    id: row.id, code: row.code, name: row.name,
    email: row.email || '', phone: row.phone || '',
    tier: row.tier, seat: row.seat || '', company: row.company || '',
    checkedIn: row.checked_in,
    checkedInAt: row.checked_in_at ? row.checked_in_at.toISOString() : null,
    checkedInBy: row.checked_in_by || null,
    createdAt: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
  };
}

export default router;
