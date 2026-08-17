/**
 * PassGuard API Client
 * All methods call the Express backend which talks to Neon PostgreSQL.
 * The Vite proxy forwards /api/* → http://localhost:3001/api/*
 */

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE = API_URL ? `${API_URL.replace(/\/$/, '')}/api` : '/api';

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== null) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${BASE}${path}`, opts);
  } catch (err) {
    throw new Error(`Cannot connect to backend server (${err.message}). Ensure the API server is running on port 3001.`);
  }

  const contentType = res.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (data && data.error) {
      throw new Error(data.error);
    }
    if (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error(`API server is unreachable (HTTP ${res.status}). Make sure the backend is running with 'npm run dev' or 'npm run dev:all'.`);
    }
    throw new Error(`Server returned HTTP ${res.status}`);
  }

  if (data === null) {
    throw new Error('Received unexpected non-JSON response from server. Make sure the backend server is running on port 3001.');
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
