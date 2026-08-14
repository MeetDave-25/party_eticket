/**
 * PassGuard API Client
 * All methods call the Express backend which talks to Neon PostgreSQL.
 * The Vite proxy forwards /api/* → http://localhost:3001/api/*
 */

const BASE = '/api';

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== null) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  // ── Health ──────────────────────────────────────────────────
  health: () => request('GET', '/health'),

  // ── Attendees ────────────────────────────────────────────────
  getAttendees:           ()         => request('GET',    '/attendees'),
  getAttendee:            (id)       => request('GET',    `/attendees/${id}`),
  findAttendee:           (query)    => request('GET',    `/attendees/find/${encodeURIComponent(query)}`),
  createAttendee:         (data)     => request('POST',   '/attendees', data),
  updateAttendee:         (id, data) => request('PUT',    `/attendees/${id}`, data),
  deleteAttendee:         (id)       => request('DELETE', `/attendees/${id}`),

  // ── Scanner / Verification ───────────────────────────────────
  verifyTicket:           (identifier, gateLocation = 'Gate Alpha') =>
    request('POST', '/scan/verify', { identifier, gateLocation }),
  undoCheckIn:            (attendeeId) =>
    request('POST', '/scan/undo', { attendeeId }),
  getScanLogs:            () => request('GET',    '/scan/logs'),
  clearScanLogs:          () => request('DELETE', '/scan/logs'),

  // ── Seed ─────────────────────────────────────────────────────
  seedDemoData:           () => request('POST', '/seed'),
};
