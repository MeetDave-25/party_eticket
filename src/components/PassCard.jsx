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
      <div ref={containerRef} style={{ 
        width: '100%', 
        maxWidth: 800, 
        aspectRatio: '1500 / 1000', // Approx landscape aspect ratio
        background: '#000', 
        borderRadius: 16, 
        overflow: 'hidden', 
        position: 'relative', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)' 
      }}>
        <img src="/pass.jpeg" alt="Pass Background" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        
        {/* QR Code Overlay (Right side box) */}
        <div style={{ 
          position: 'absolute', 
          right: '5.2%', 
          top: '30%', 
          width: '21.5%', 
          aspectRatio: '1/1', 
          background: 'white',
          padding: '2%',
          borderRadius: 8
        }}>
          {qrUrl ? <img src={qrUrl} style={{ width: '100%', height: '100%', display: 'block' }} alt="QR Code" /> : null}
        </div>

        {/* Attendee Name overlay */}
        <div style={{ 
          position: 'absolute', 
          right: '5.2%', 
          top: '23%', 
          width: '21.5%', 
          textAlign: 'center', 
          color: '#38bdf8', 
          fontSize: 'clamp(12px, 1.8vw, 24px)', 
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
        }}>
          {attendee.name}
        </div>

        {/* Ticket Code overlay */}
        <div style={{ 
          position: 'absolute', 
          right: '5.2%', 
          top: '56%', 
          width: '21.5%', 
          textAlign: 'center', 
          color: '#fff', 
          fontSize: 'clamp(10px, 1.4vw, 18px)', 
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
        }}>
          {attendee.code}
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
