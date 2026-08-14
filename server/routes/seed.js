import { Router } from 'express';
import sql from '../db.js';

const router = Router();

const DEMO_ATTENDEES = [
  { id: 'att_001', code: 'PASS-VIP-9021', name: 'Alexander Mercer',    email: 'alexander.m@vertex.io',      phone: '+1 (555) 234-5678', tier: 'VIP',       seat: 'Row A • Seat 01 (Front Stage)', company: 'Vertex AI Labs',         notes: 'Keynote VIP Guest & Investor' },
  { id: 'att_002', code: 'PASS-SPK-4412', name: 'Dr. Sophia Ramirez',  email: 'sophia.ramirez@mit.edu',     phone: '+1 (555) 876-5432', tier: 'SPEAKER',   seat: 'Speaker Lounge • Pod 3',       company: 'MIT Quantum Computing',   notes: 'Keynote Speaker (Day 1, 11 AM)' },
  { id: 'att_003', code: 'PASS-ORG-7789', name: 'Marcus Vance',        email: 'marcus.v@summit2026.org',   phone: '+1 (555) 456-7890', tier: 'ORGANIZER', seat: 'All-Access Pass',              company: 'Tech Summit Global',      notes: 'Lead Stage Director' },
  { id: 'att_004', code: 'PASS-GEN-1033', name: 'Elena Rostova',       email: 'elena.rostova@cloudscale.net', phone: '+1 (555) 321-0987', tier: 'GENERAL', seat: 'Hall B • Section 3',           company: 'CloudScale Systems',      notes: 'General Attendee' },
  { id: 'att_005', code: 'PASS-PRS-6621', name: 'Tariq Okonkwo',       email: 'tariq.ok@newstech.io',       phone: '+1 (555) 112-3344', tier: 'PRESS',     seat: 'Press Deck • Row 2',           company: 'NewsTech Media',          notes: 'Live Coverage Reporter' },
  { id: 'att_006', code: 'PASS-STU-3305', name: 'Priya Nair',          email: 'priya.n@iitb.ac.in',         phone: '+91 98765 43210',   tier: 'STUDENT',   seat: 'Hall C • Student Zone',        company: 'IIT Bombay',              notes: 'Scholarship Awardee' },
];

// POST /api/seed — disabled for real-life mode
router.post('/', async (req, res) => {
  res.json({ message: 'Seed endpoint disabled for production.', inserted: [] });
});

export default router;
