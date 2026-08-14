/**
 * PassGuard Storage Service — PostgreSQL Edition
 *
 * Provides the SAME method interface as the old localStorage version,
 * but now every call goes to the Neon PostgreSQL backend via api.js.
 *
 * All methods are now async/await.
 * Components must await these calls (or use .then()).
 *
 * A sessionStorage mini-cache holds the active user so page refreshes
 * don't lose the logged-in state on the client side.
 */

import { api } from './api.js';

// ─── Change event broadcaster ────────────────────────────────
function notifyChange() {
  window.dispatchEvent(new Event('passguard_data_change'));
}

// ─── Pass Tiers ─────────────────────────────────────────────
export const PASS_TIERS = {
  VIP:       { label: 'VIP Pass',       description: 'Premium front-row access + lounge',       color: '#FFE500', icon: 'Crown' },
  SPEAKER:   { label: 'Speaker Pass',   description: 'Speaker room + stage area access',         color: '#C084FC', icon: 'Mic' },
  ORGANIZER: { label: 'Organizer Pass', description: 'All-access staff & organizer badge',       color: '#FF2D9B', icon: 'ShieldCheck' },
  PRESS:     { label: 'Press & Media',  description: 'Press deck + media coverage credentials',  color: '#00FF87', icon: 'Camera' },
  GENERAL:   { label: 'General Access', description: 'Main hall general admission',              color: '#00D9FF', icon: 'Ticket' },
  STUDENT:   { label: 'Student Pass',   description: 'Discounted student admission',             color: '#9D4EDD', icon: 'GraduationCap' },
};

// ─── Active User (client-side session in sessionStorage) ──────
const ACTIVE_USER_KEY = 'pg_active_user';

// ─── Storage Service ─────────────────────────────────────────
export const storage = {

  // ── Initialization ────────────────────────────────────────
  async ensureInitialized() {
    try {
      await api.seedDemoData(); // seeds only if DB is empty
    } catch (err) {
      console.warn('Could not seed demo data:', err.message);
    }
  },

  // ── Attendees ─────────────────────────────────────────────
  async getAttendees() {
    try {
      return await api.getAttendees();
    } catch (err) {
      console.error('getAttendees failed:', err);
      return [];
    }
  },

  async addAttendee(data) {
    const attendee = await api.createAttendee(data);
    notifyChange();
    return attendee;
  },

  async updateAttendee(id, updates) {
    const attendee = await api.updateAttendee(id, updates);
    notifyChange();
    return attendee;
  },

  async deleteAttendee(id) {
    await api.deleteAttendee(id);
    notifyChange();
  },

  async findAttendeeByIdentifier(query) {
    try {
      return await api.findAttendee(query);
    } catch {
      return null; // 404 = not found = null
    }
  },

  // ── Verification (delegates to server-side atomic logic) ──
  async verifyAndCheckInTicket(identifier, gateLocation = 'Gate Alpha') {
    const result = await api.verifyTicket(identifier, gateLocation);
    notifyChange();
    return result;
  },

  async undoCheckIn(attendeeId) {
    const result = await api.undoCheckIn(attendeeId);
    notifyChange();
    return result;
  },

  // ── Scan Logs ─────────────────────────────────────────────
  async getScanLogs() {
    try {
      return await api.getScanLogs();
    } catch {
      return [];
    }
  },

  async clearScanLogs() {
    await api.clearScanLogs();
    notifyChange();
  },

  // ── Active User session (sessionStorage — client side only) ──
  getActiveUser() {
    try {
      const raw = sessionStorage.getItem(ACTIVE_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setActiveUser(attendee) {
    if (!attendee) {
      sessionStorage.removeItem(ACTIVE_USER_KEY);
    } else {
      sessionStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(attendee));
    }
    notifyChange();
  },

  clearActiveUser() {
    sessionStorage.removeItem(ACTIVE_USER_KEY);
    notifyChange();
  },

  // ── Reset Demo Data ───────────────────────────────────────
  async resetToDemoData() {
    // Delete all attendees and logs, then re-seed
    try {
      const attendees = await this.getAttendees();
      for (const a of attendees) {
        await api.deleteAttendee(a.id);
      }
      await api.clearScanLogs();
      // Force re-seed (seed route skips if data exists, so we clear first)
      await api.seedDemoData();
      notifyChange();
    } catch (err) {
      console.error('Reset failed:', err);
    }
  },
};
