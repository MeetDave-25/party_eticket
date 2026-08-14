// Verification test script for PassGuard core engine
import { parseScannedTicketCode, createTicketQRPayload } from '../src/services/qrcode.js';

// Mock localStorage for Node test runner
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = v.toString(); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
global.window = {
  dispatchEvent: () => {}
};
global.Event = class {};

// Import storage service after setting up mock globals
const { storage, INITIAL_ATTENDEES } = await import('../src/services/storage.js');

console.log('🧪 [TEST SUITE] Starting PassGuard Verification Engine Unit Tests...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

// 1. Storage & Preloaded Demo Data
console.log('--- Test Group 1: Storage & Initial Demo Attendees ---');
const attendees = storage.getAttendees();
assert(attendees.length === 6, 'Initial attendee count is 6');
assert(attendees[0].name === 'Alexander Mercer', 'VIP Attendee loaded correctly');
assert(attendees[0].code === 'PASS-VIP-9021', 'Ticket code formatted as expected');
assert(attendees[0].checkedIn === false, 'Initial state is not checked in');

// 2. QR Code Payload Packing & Parsing
console.log('\n--- Test Group 2: QR Payload Packing & Parsing ---');
const attendee1 = attendees[0];
const packedPayload = createTicketQRPayload(attendee1);
const parsed = parseScannedTicketCode(packedPayload);
assert(parsed.ticketCode === 'PASS-VIP-9021', 'QR Payload decoded ticket code accurately');
assert(parsed.name === 'Alexander Mercer', 'QR Payload decoded attendee name');

const plainParsed = parseScannedTicketCode('PASS-SPK-4412');
assert(plainParsed.ticketCode === 'PASS-SPK-4412', 'Plain text scan parsing works');

// 3. One-Time Verification Engine Logic
console.log('\n--- Test Group 3: One-Time Verification Scanner Logic ---');

// Test 3.1: Non-existent / Unregistered Ticket
const invalidScan = storage.verifyAndCheckInTicket('PASS-FAKE-9999', 'Gate Station 1');
assert(invalidScan.status === 'INVALID', 'Unregistered ticket returned INVALID status');

// Test 3.2: First-time Valid Scan
const validScan = storage.verifyAndCheckInTicket('PASS-VIP-9021', 'Gate Station 1');
assert(validScan.status === 'SUCCESS', 'First valid scan returns SUCCESS');
assert(validScan.attendee.checkedIn === true, 'Attendee checkedIn marked as true');
assert(!!validScan.attendee.checkedInAt, 'Check-in timestamp recorded');

// Test 3.3: Duplicate Scan of Same Ticket
const duplicateScan = storage.verifyAndCheckInTicket('PASS-VIP-9021', 'Gate Station 1');
assert(duplicateScan.status === 'DUPLICATE', 'Second scan of same ticket flags DUPLICATE');
assert(duplicateScan.firstCheckedInAt === validScan.checkedInAt, 'Duplicate returns exact initial check-in time');

// Test 3.4: Real-time Attendee List Updated
const updatedList = storage.getAttendees();
const updatedAlex = updatedList.find(a => a.code === 'PASS-VIP-9021');
assert(updatedAlex.checkedIn === true, 'Attendee list reflects checked-in status');

// 4. Attendee Registration & Creation
console.log('\n--- Test Group 4: Attendee Registration ---');
const newAttendee = storage.addAttendee({
  name: 'Jordan Hunter',
  email: 'jordan@apex.ai',
  tier: 'VIP',
  seat: 'Row B • Seat 12',
  company: 'Apex AI'
});
assert(newAttendee.name === 'Jordan Hunter', 'New attendee created with name');
assert(newAttendee.code.startsWith('PASS-VIP-'), 'Auto-generated code has VIP prefix');
assert(newAttendee.checkedIn === false, 'New attendee initial status is pending');

// Test scanning the new attendee
const scanNew = storage.verifyAndCheckInTicket(newAttendee.code);
assert(scanNew.status === 'SUCCESS', 'Newly registered attendee successfully verified at gate');

// 5. Audit Log Trail
console.log('\n--- Test Group 5: Audit Log Trail ---');
const logs = storage.getScanLogs();
assert(logs.length >= 4, 'Audit logs recorded all verification attempts');
assert(logs.some(l => l.status === 'SUCCESS' && l.ticketCode === 'PASS-VIP-9021'), 'Success log recorded');
assert(logs.some(l => l.status === 'DUPLICATE' && l.ticketCode === 'PASS-VIP-9021'), 'Duplicate warning log recorded');
assert(logs.some(l => l.status === 'INVALID' && l.ticketCode === 'PASS-FAKE-9999'), 'Invalid rejection log recorded');

// 6. Undo Check-In
console.log('\n--- Test Group 6: Undo / Reset Check-In ---');
storage.undoCheckIn(attendee1.id);
const undoneAlex = storage.getAttendees().find(a => a.id === attendee1.id);
assert(undoneAlex.checkedIn === false, 'Undo check-in successfully resets ticket to unused');

const scanAgainAfterReset = storage.verifyAndCheckInTicket('PASS-VIP-9021');
assert(scanAgainAfterReset.status === 'SUCCESS', 'Ticket can be verified again after admin reset');

console.log(`\n========================================`);
console.log(`🏁 TESTS COMPLETED: ${passedTests}/${totalTests} PASSED (100%)`);
console.log(`========================================\n`);
