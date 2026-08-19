import React, { useEffect, useRef, useState } from 'react';
import { PASS_TIERS } from '../services/storage';
import { generateQRCode, createTicketQRPayload } from '../services/qrcode';
import { Download, Share2, Scan, CheckCircle2, User, Sparkles } from 'lucide-react';
import { sound } from '../services/audio';

export default function PassCard({ attendee, eventInfo, showActions = true, onSimulateScan }) {
  const containerRef = useRef(null);
  const [qrUrl, setQrUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!attendee?.code) return;
    
    // Generate clean, high-contrast, crisp QR code with bold modules
    const qrData = attendee.code; // Clean ticket code for optimal scannability & aesthetic square modules
    generateQRCode(qrData, {
      width: 400,
      margin: 1,
      errorCorrectionLevel: 'M',
      darkColor: '#000000',
      lightColor: '#FFFFFF',
    }).then(url => {
      setQrUrl(url);
    });
  }, [attendee]);

  if (!attendee) return null;
  const tierInfo = PASS_TIERS[attendee.tier] || PASS_TIERS.GENERAL;

  const downloadTicket = async () => {
    if (!containerRef.current || downloading) return;
    sound.playClick();
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(containerRef.current, {
        scale: 3, // 3x high resolution for crisp print/screen quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false
      });
      const a = document.createElement('a');
      const safeName = (attendee.name || 'Attendee').replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `Vasteguna_Pass_${safeName}_${attendee.code}.png`;
      a.href = canvas.toDataURL('image/png', 1.0);
      a.click();
      sound.playSuccess();
    } catch (err) {
      console.error('Ticket download error:', err);
      alert('Failed to save ticket image. Please take a screenshot instead.');
    } finally {
      setDownloading(false);
    }
  };

  const shareTicket = async () => {
    sound.playClick();
    const shareText = `🎟️ My Official Pass for VASTEGUNA HAUIYAA 2026!\n👤 Name: ${attendee.name}\n🎫 Pass Code: ${attendee.code}\n📅 Date: 20th August 2026 | 11:00 AM - 3:00 PM\n📍 Venue: Rewind The Disc`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Vasteguna Hauiyaa 2026 E-Pass',
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // Fallback to clipboard or whatsapp
      }
    }

    // WhatsApp share fallback
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + window.location.href)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', width: '100%', maxWidth: 800 }}>
      
      {/* ─── TICKET CONTAINER (1536 x 1024 -> 1.5 Aspect Ratio) ─── */}
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          aspectRatio: '1536 / 1024',
          background: '#0B0F19', 
          borderRadius: 16, 
          overflow: 'hidden', 
          position: 'relative', 
          boxShadow: '0 12px 35px rgba(0,0,0,0.6), 0 0 20px rgba(107,33,168,0.25)',
          userSelect: 'none',
        }}
      >
        {/* Background Image: Fresher Pass Template */}
        <img 
          src="/fresher_pass.jpeg" 
          alt="Vasteguna Hauiyaa Pass" 
          crossOrigin="anonymous" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            display: 'block' 
          }} 
        />
        
        {/* ─── ATTENDEE BADGE OVERLAY (Top Left Ribbon) ─── */}
        <div style={{
          position: 'absolute',
          left: '2.5%',
          top: '2.5%',
          background: 'rgba(11, 15, 25, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1.5px solid rgba(251, 191, 36, 0.7)',
          borderRadius: 30,
          padding: '4px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.7), 0 0 10px rgba(251, 191, 36, 0.25)',
          pointerEvents: 'none',
          maxWidth: '50%',
          zIndex: 5
        }}>
          <span style={{ fontSize: 'clamp(10px, 1.2vw, 14px)' }}>👑</span>
          <span style={{
            color: '#FBBF24',
            fontSize: 'clamp(8px, 1.0vw, 12px)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: '0 2px 4px rgba(0,0,0,0.9)'
          }}>
            {attendee.name}
          </span>
          <span style={{
            background: 'var(--purple-main, #6B21A8)',
            color: '#FFFFFF',
            fontSize: 'clamp(7px, 0.8vw, 10px)',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            {attendee.tier || 'PASS'}
          </span>
        </div>

        {/* ─── DYNAMIC QR CODE OVERLAY (Inside Neon QR Box) ─── */}
        <div style={{ 
          position: 'absolute', 
          left: '79.5%', 
          top: '33.5%', 
          width: '16.8%', 
          height: '25.3%', 
          background: '#FFFFFF',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.85)',
          pointerEvents: 'none',
          zIndex: 5,
          boxSizing: 'border-box',
          padding: '2%'
        }}>
          {qrUrl ? (
            <img 
              src={qrUrl} 
              style={{ width: '94%', height: '94%', display: 'block', objectFit: 'contain' }} 
              alt={`Gate QR Code for ${attendee.code}`} 
            />
          ) : (
            <div style={{ fontSize: 9, color: '#6B7280', textAlign: 'center' }}>Generating…</div>
          )}
        </div>

        {/* ─── DYNAMIC TICKET CODE OVERLAY (Inside Password Pill Box) ─── */}
        <div style={{ 
          position: 'absolute', 
          left: '78.5%', 
          top: '63.5%', 
          width: '19.0%', 
          height: '7.2%', 
          background: '#0B0F19',
          border: '1.5px solid rgba(236, 72, 153, 0.8)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(236, 72, 153, 0.4)',
          zIndex: 5,
          padding: '0 2px',
          boxSizing: 'border-box'
        }}>
          <span style={{ 
            color: '#FACC15', 
            fontSize: 'clamp(7px, 1.0vw, 12px)', 
            fontWeight: 900,
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 6px rgba(250, 204, 21, 0.5)',
            lineHeight: 1,
            textAlign: 'center'
          }}>
            {attendee.code || 'VASTEGUNA2026'}
          </span>
        </div>

      </div>

      {/* ─── ACTIONS TOOLBAR ─── */}
      {showActions && (
        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 440, flexWrap: 'wrap' }}>
          <button 
            onClick={downloadTicket} 
            disabled={downloading}
            className="btn-primary" 
            style={{ 
              flex: 1, 
              minWidth: 140,
              padding: '12px 16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 8,
              fontSize: 14,
              fontWeight: 700
            }}
          >
            <Download size={16} /> {downloading ? 'Saving…' : 'Save Ticket PNG'}
          </button>

          <button 
            onClick={shareTicket}
            className="btn-secondary" 
            style={{ 
              flex: 1, 
              minWidth: 120,
              padding: '12px 16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 8,
              fontSize: 14,
              fontWeight: 700
            }}
          >
            <Share2 size={16} /> Share Pass
          </button>

          {onSimulateScan && (
            <button 
              onClick={() => onSimulateScan(attendee.code)} 
              className="btn-success" 
              style={{ 
                width: '100%',
                padding: '12px 16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 8,
                fontSize: 14,
                fontWeight: 700
              }}
            >
              <Scan size={16} /> Test Scan at Gate
            </button>
          )}
        </div>
      )}
      
    </div>
  );
}
