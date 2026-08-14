import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { PASS_TIERS } from '../services/storage';
import { Download, Share2, Scan } from 'lucide-react';

export default function PassCard({ attendee, eventInfo, showActions = true, onSimulateScan }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (!attendee?.code) return;
    const data = JSON.stringify({ passGuardSignature: 'v1', ticketCode: attendee.code });
    QRCode.toDataURL(data, {
      width: 200, margin: 1,
      color: { dark: '#111827', light: '#FFFFFF' }
    }).then(url => setQrUrl(url));
  }, [attendee]);

  if (!attendee) return null;
  const tierInfo = PASS_TIERS[attendee.tier] || PASS_TIERS.GENERAL;
  const col = '#6B21A8'; // Main purple

  const downloadTicket = () => {
    if (!containerRef.current) return;
    import('html2canvas').then(html2canvas => {
      html2canvas.default(containerRef.current, { scale: 2, backgroundColor: null }).then(canvas => {
        const a = document.createElement('a');
        a.download = `Vasteguna_${attendee.name.replace(/\s+/g, '_')}_Pass.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      });
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      
      {/* ─── TICKET CONTAINER ─── */}
      <div ref={containerRef} style={{ width: 340, background: 'white', border: '3px solid var(--black-ink)', borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: '6px 6px 0 rgba(17,24,39,0.1)' }}>
        
        {/* Ticket Header */}
        <div style={{ background: 'var(--yellow-marker)', padding: '20px 20px 30px', textAlign: 'center', borderBottom: '3px dashed var(--black-ink)', position: 'relative' }}>
          <p className="marker-font" style={{ fontSize: 24, color: 'var(--purple-main)', lineHeight: 1 }}>{eventInfo.name}</p>
          <div style={{ display: 'inline-block', background: 'var(--black-ink)', color: 'white', padding: '4px 12px', fontSize: 11, fontWeight: 800, marginTop: 6, transform: 'rotate(-2deg)' }}>
            {eventInfo.subtitle}
          </div>
          {/* Half-circles for ticket tear effect */}
          <div style={{ position: 'absolute', bottom: -12, left: -12, width: 20, height: 20, background: 'var(--paper-bg)', borderRadius: '50%', border: '3px solid var(--black-ink)' }} />
          <div style={{ position: 'absolute', bottom: -12, right: -12, width: 20, height: 20, background: 'var(--paper-bg)', borderRadius: '50%', border: '3px solid var(--black-ink)' }} />
        </div>

        {/* Ticket Body */}
        <div style={{ padding: '30px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'2\' cy=\'2\' r=\'1\' fill=\'%23e5e7eb\'/%3E%3C/svg%3E")' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--black-ink)', marginBottom: 4 }}>{attendee.name}</h2>
            {attendee.company && <p style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>{attendee.company}</p>}
            <div style={{ marginTop: 10, display: 'inline-block', padding: '6px 16px', border: `2px solid ${col}`, color: col, borderRadius: 100, fontSize: 12, fontWeight: 800, letterSpacing: '0.05em' }}>
              {tierInfo.label} PASS
            </div>
          </div>

          <div style={{ padding: 12, background: 'white', border: '3px solid var(--black-ink)', borderRadius: 12, marginBottom: 20, transform: 'rotate(1deg)' }}>
            {qrUrl ? <img src={qrUrl} width={160} height={160} alt="QR Code" style={{ display: 'block' }} /> : <div style={{ width: 160, height: 160, background: '#f3f4f6' }} />}
          </div>

          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: '#4B5563', letterSpacing: '0.1em' }}>{attendee.code}</p>

        </div>

        {/* Ticket Footer */}
        <div style={{ background: 'var(--purple-main)', padding: '16px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '3px solid var(--black-ink)' }}>
          <div style={{ fontSize: 11, fontWeight: 700 }}>
            <p style={{ opacity: 0.7, marginBottom: 2 }}>VENUE</p>
            <p>{eventInfo.venue}</p>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'right' }}>
            <p style={{ opacity: 0.7, marginBottom: 2 }}>DATE</p>
            <p>{eventInfo.date}</p>
          </div>
        </div>

      </div>

      {/* ─── ACTIONS ─── */}
      {showActions && (
        <div style={{ display: 'flex', gap: 10, width: 340 }}>
          <button onClick={downloadTicket} className="btn-secondary" style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Download size={16} /> Save Ticket
          </button>
          {onSimulateScan && (
            <button onClick={() => onSimulateScan(attendee.code)} className="btn-success" style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Scan size={16} /> Test Scan
            </button>
          )}
        </div>
      )}
      
    </div>
  );
}
