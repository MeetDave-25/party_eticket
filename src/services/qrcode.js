import QRCode from 'qrcode';

/**
 * Generate a high-contrast, high-resolution QR code data URL
 */
export async function generateQRCode(text, options = {}) {
  try {
    return await QRCode.toDataURL(text, {
      width: options.width || 400,
      margin: options.margin !== undefined ? options.margin : 1,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'H',
    });
  } catch (err) {
    console.error('QR code generation failed:', err);
    return '';
  }
}

/**
 * Creates a structured string payload for the QR code.
 * We include ticketCode, code, id, name, and timestamp.
 */
export function createTicketQRPayload(attendee) {
  if (!attendee) return '';
  const payload = {
    t: 'VASTEGUNA_2026',
    ticketCode: attendee.code,
    c: attendee.code,
    id: attendee.id,
    n: attendee.name,
    e: attendee.email || '',
    r: attendee.tier || 'GENERAL',
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
    if (data && typeof data === 'object') {
      const code = data.ticketCode || data.code || data.c || data.id;
      if (code) {
        return {
          ticketCode: code.toString().toUpperCase().trim(),
          name: data.n || data.name || null,
          tier: data.r || data.tier || null,
          payload: data
        };
      }
    }
  } catch (e) {
    // Not a JSON string, proceed to next format
  }

  // Case 2: URL containing code or ticket query param or hash param
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const codeParam = url.searchParams.get('code') || 
                        url.searchParams.get('ticket') || 
                        url.searchParams.get('ticketCode') || 
                        url.searchParams.get('pass');
      if (codeParam) {
        return { ticketCode: codeParam.toUpperCase().trim(), name: null, tier: null, payload: null };
      }
      if (url.hash) {
        const hashQuery = url.hash.includes('?') ? url.hash.split('?')[1] : url.hash.replace('#', '');
        const hashParams = new URLSearchParams(hashQuery);
        const hCode = hashParams.get('code') || hashParams.get('ticket');
        if (hCode) {
          return { ticketCode: hCode.toUpperCase().trim(), name: null, tier: null, payload: null };
        }
      }
    } catch (e) {}
  }

  // Case 3: Plain text ticket code like "PASS-GEN-8421" or "PG-12345"
  return {
    ticketCode: trimmed.toUpperCase(),
    name: null,
    tier: null,
    payload: null
  };
}
