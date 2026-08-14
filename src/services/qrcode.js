import QRCode from 'qrcode';

/**
 * Generate a high-contrast, high-resolution QR code data URL
 */
export async function generateQRCode(text, options = {}) {
  try {
    return await QRCode.toDataURL(text, {
      width: options.width || 320,
      margin: options.margin || 2,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('QR code generation failed:', err);
    return '';
  }
}

/**
 * Creates a structured string payload for the QR code.
 * We include ticket code, id, name, and an authenticity signature.
 */
export function createTicketQRPayload(attendee) {
  const payload = {
    t: 'PASSGUARD',
    id: attendee.id,
    c: attendee.code,
    n: attendee.name,
    e: attendee.email,
    r: attendee.tier,
    s: attendee.seat || 'GENERAL',
    ts: attendee.createdAt || new Date().toISOString()
  };
  return JSON.stringify(payload);
}

/**
 * Parses and extracts ticket code or id from scanned string
 */
export function parseScannedTicketCode(scannedText) {
  if (!scannedText) return null;
  const trimmed = scannedText.trim();
  
  // Case 1: Try JSON format payload
  try {
    const data = JSON.parse(trimmed);
    if (data && (data.c || data.code || data.id)) {
      return {
        ticketCode: (data.c || data.code || data.id).toString().toUpperCase().trim(),
        name: data.n || data.name,
        tier: data.r || data.tier,
        payload: data
      };
    }
  } catch (e) {
    // Not a JSON string, proceed to raw string checking
  }

  // Case 2: Plain text ticket code like "PASS-7K9A-2026" or "PG-12345"
  return {
    ticketCode: trimmed.toUpperCase(),
    name: null,
    tier: null,
    payload: null
  };
}
