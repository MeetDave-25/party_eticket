-- PassGuard Database Schema
-- Run this once to initialize the Neon PostgreSQL tables

CREATE TABLE IF NOT EXISTS attendees (
  id           TEXT PRIMARY KEY,
  code         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  email        TEXT,
  phone        TEXT,
  tier         TEXT NOT NULL DEFAULT 'GENERAL',
  seat         TEXT,
  company      TEXT,
  notes        TEXT,
  transaction_id TEXT,
  payment_proof TEXT,
  status       TEXT NOT NULL DEFAULT 'APPROVED',
  checked_in   BOOLEAN NOT NULL DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  checked_in_by TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE attendees ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS payment_proof TEXT;

CREATE TABLE IF NOT EXISTS scan_logs (
  id              TEXT PRIMARY KEY,
  ticket_code     TEXT NOT NULL,
  attendee_id     TEXT,
  attendee_name   TEXT,
  attendee_tier   TEXT,
  status          TEXT NOT NULL,   -- SUCCESS | DUPLICATE | INVALID
  message         TEXT,
  gate_location   TEXT,
  device          TEXT,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_attendees_code  ON attendees (UPPER(code));
CREATE INDEX IF NOT EXISTS idx_attendees_email ON attendees (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_scan_logs_ts    ON scan_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scan_logs_code  ON scan_logs (ticket_code);
