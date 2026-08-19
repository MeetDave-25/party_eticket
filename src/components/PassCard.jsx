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
        aspectRatio: '1536 / 1024',
        background: '#000', 
        borderRadius: 16, 
        overflow: 'hidden', 
        position: 'relative', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)' 
      }}>
        <img src="/pass.jpeg" alt="Pass Background" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        
        {/* ─── NEON ENTRY BOX OVERLAY (Right stub) ─── */}
        <div style={{ 
          position: 'absolute', 
          left: '76.8%', 
          top: '29.8%', 
          width: '20.6%', 
          height: '34.2%', 
          background: 'transparent',
          padding: '2px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
          pointerEvents: 'none'
        }}>
          {/* 1. Attendee Name (Top) */}
          <div style={{ 
            width: '100%',
            textAlign: 'center', 
            color: '#38bdf8', 
            fontSize: 'clamp(8px, 1.15vw, 14px)', 
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(56, 189, 248, 0.4)',
            lineHeight: 1.1,
            padding: '0 4px'
          }}>
            {attendee.name}
          </div>

          {/* 2. QR Code (Center - completely clean & unobstructed) */}
          <div style={{ 
            background: 'white',
            padding: '3%',
            borderRadius: 8,
            width: '66%',
            aspectRatio: '1 / 1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
            flexShrink: 0
          }}>
            {qrUrl ? (
              <img 
                src={qrUrl} 
                style={{ width: '100%', height: '100%', display: 'block' }} 
                alt="Gate QR Code" 
              />
            ) : null}
          </div>

          {/* 3. Ticket Code (Bottom) */}
          <div style={{ 
            width: '100%',
            textAlign: 'center', 
            color: '#FBBF24', 
            fontSize: 'clamp(8px, 0.95vw, 12px)', 
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.06em',
            textShadow: '0 2px 4px rgba(0,0,0,0.9)',
            lineHeight: 1.1,
            padding: '0 4px'
          }}>
            {attendee.code}
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
