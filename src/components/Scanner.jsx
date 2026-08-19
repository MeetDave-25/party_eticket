import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { storage } from '../services/storage';
import { sound } from '../services/audio';
import { parseScannedTicketCode } from '../services/qrcode';
import {
  Scan, Camera, Upload, Keyboard, CheckCircle2, AlertTriangle,
  XCircle, ArrowRight, Play, Square, SwitchCamera, CornerUpLeft, Loader, X
} from 'lucide-react';

export default function Scanner({ initialCode = null, onClearInitialCode }) {
  const [scanMode, setScanMode] = useState('camera');
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [result, setResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [resetting, setResetting] = useState(false);

  const html5QrRef = useRef(null);
  const isModalOpenRef = useRef(false);
  const verifyingRef = useRef(false);
  const lastScanTimeRef = useRef(0);
  const lastScannedCodeRef = useRef('');

  useEffect(() => {
    if (initialCode) {
      handleVerify(initialCode);
      if (onClearInitialCode) onClearInitialCode();
    }
  }, [initialCode]);

  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices?.length) {
        setCameras(devices);
        const back = devices.find(d => /back|rear|environment/i.test(d.label));
        setActiveCameraId(back ? back.id : devices[0].id);
      }
    }).catch(() => {});
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (scanMode === 'camera') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [scanMode, activeCameraId]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpenRef.current) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const startCamera = async (camId = activeCameraId) => {
    setCameraError(null);
    try {
      if (html5QrRef.current?.isScanning) await html5QrRef.current.stop();
      html5QrRef.current = new Html5Qrcode('qr-viewport');
      await html5QrRef.current.start(
        camId || (cameras.length ? cameras[0].id : { facingMode: 'environment' }),
        { fps: 15, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        (text) => {
          // If modal is active or verification in progress, ignore incoming frames
          if (isModalOpenRef.current || verifyingRef.current) return;

          const parsed = parseScannedTicketCode(text);
          if (!parsed?.ticketCode) return;

          const now = Date.now();
          const cleanCode = parsed.ticketCode.trim().toUpperCase();

          // Prevent repeated rapid scans of the same code within 4 seconds
          if (cleanCode === lastScannedCodeRef.current && (now - lastScanTimeRef.current < 4000)) {
            return;
          }

          lastScanTimeRef.current = now;
          lastScannedCodeRef.current = cleanCode;
          handleVerify(cleanCode);
        },
        () => {}
      );
      setIsScanning(true);
    } catch {
      setCameraError('Camera permission denied or not available. Use Image Upload or Manual Entry below.');
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrRef.current?.isScanning) {
      try { await html5QrRef.current.stop(); } catch {}
      setIsScanning(false);
    }
  };

  const closeModal = () => {
    sound.playClick();
    setResult(null);
    isModalOpenRef.current = false;
    verifyingRef.current = false;
    // Set grace period so the same code is not immediately re-scanned
    lastScanTimeRef.current = Date.now() + 1500;
    
    // Resume camera feed if it was paused
    if (html5QrRef.current?.isScanning) {
      try { html5QrRef.current.resume(); } catch {}
    }
  };

  const handleVerify = async (code) => {
    if (!code || verifyingRef.current) return;
    verifyingRef.current = true;
    setVerifying(true);

    // Pause camera scan while verifying/showing modal
    if (html5QrRef.current?.isScanning) {
      try { html5QrRef.current.pause(true); } catch {}
    }

    try {
      const res = await storage.verifyAndCheckInTicket(code.trim().toUpperCase(), 'Main Gate');
      setResult(res);
      isModalOpenRef.current = true;

      if (res.status === 'SUCCESS') {
        sound.playSuccess();
        try { confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#10B981', '#FBBF24', '#6B21A8', '#EC4899'] }); } catch {}
      } else if (res.status === 'DUPLICATE') {
        sound.playWarning();
      } else {
        sound.playError();
      }
    } catch (err) {
      setResult({ status: 'INVALID', ticketCode: code, message: `Server error: ${err.message}` });
      isModalOpenRef.current = true;
      sound.playError();
    } finally {
      setVerifying(false);
      verifyingRef.current = false;
    }
  };

  const handleResetCheckIn = async (attendeeId) => {
    if (!attendeeId || resetting) return;
    setResetting(true);
    sound.playClick();
    try {
      await storage.undoCheckIn(attendeeId);
      sound.playSuccess();
      closeModal();
    } catch (err) {
      alert(`Failed to reset pass: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const h = new Html5Qrcode('qr-file-temp');
      const text = await h.scanFile(file, true);
      const parsed = parseScannedTicketCode(text);
      if (parsed?.ticketCode) handleVerify(parsed.ticketCode);
      h.clear();
    } catch {
      setResult({ status: 'INVALID', ticketCode: 'FILE', message: 'Could not read a QR code from this image. Try a clearer photo.' });
      isModalOpenRef.current = true;
      sound.playError();
    }
  };

  const STATUS_CONFIG = {
    SUCCESS:   { color: '#10B981', bg: '#ECFDF5', border: '#10B981', icon: <CheckCircle2 size={44} color="#10B981" />, label: 'ACCESS GRANTED', sub: 'ONE-TIME ENTRY VERIFIED' },
    DUPLICATE: { color: '#F59E0B', bg: '#FEF3C7', border: '#F59E0B', icon: <AlertTriangle size={44} color="#F59E0B" />, label: 'DUPLICATE PASS', sub: 'PASS ALREADY USED' },
    INVALID:   { color: '#EF4444', bg: '#FEE2E2', border: '#EF4444', icon: <XCircle size={44} color="#EF4444" />, label: 'ACCESS DENIED', sub: 'INVALID OR UNREGISTERED PASS' },
  };

  const modes = [
    { id: 'camera', icon: <Camera size={16} />, label: 'Live Camera' },
    { id: 'upload', icon: <Upload size={16} />, label: 'Upload Image' },
    { id: 'manual', icon: <Keyboard size={16} />, label: 'Manual Code' },
  ];

  return (
    <div style={{ padding: '36px 40px', maxWidth: 1000, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <div id="qr-file-temp" style={{ display: 'none' }} />

      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--purple-light)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>VERIFICATION ENGINE</p>
        <h1 className="marker-font" style={{ fontSize: 40, color: 'var(--black-ink)', lineHeight: 1 }}>Gate QR Scanner</h1>
        <p style={{ fontSize: 15, color: '#4B5563', marginTop: 8 }}>Scan attendee passes — valid tickets checked in once, permanently locked in the database.</p>
      </div>

      {verifying && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <Loader size={48} color="var(--purple-main)" className="animate-spin" />
          <p className="marker-font" style={{ fontSize: 24, color: 'var(--purple-main)' }}>Verifying Pass…</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
            {modes.map(m => (
              <button key={m.id} onClick={() => { sound.playClick(); setScanMode(m.id); }}
                className={scanMode === m.id ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, padding: '12px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          <div className="paper-card" style={{ padding: 24 }}>
            <div className="tape top-center" style={{ width: 80, transform: 'rotate(-2deg)' }} />

            {scanMode === 'camera' && (
              <div>
                <div style={{ position: 'relative', background: '#E5E7EB', borderRadius: 12, overflow: 'hidden', border: '3px solid var(--black-ink)', aspectRatio: '1/1', maxWidth: 420, margin: '0 auto' }}>
                  <div id="qr-viewport" style={{ width: '100%', height: '100%' }} />
                  {isScanning && <div className="scan-laser" />}
                  <div className="scanner-corner scanner-corner-tl" />
                  <div className="scanner-corner scanner-corner-tr" />
                  <div className="scanner-corner scanner-corner-bl" />
                  <div className="scanner-corner scanner-corner-br" />
                  {!isScanning && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                      <Camera size={48} color="#9CA3AF" />
                      <p style={{ fontSize: 15, color: '#4B5563', textAlign: 'center', padding: '0 24px', fontWeight: 600 }}>{cameraError || 'Camera paused'}</p>
                      <button className="btn-primary" style={{ padding: '12px 24px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => startCamera()}>
                        <Play size={16} /> Start Camera
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
                  {cameras.length > 1 && (
                    <button className="btn-secondary" style={{ padding: '12px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                      onClick={() => { const idx = cameras.findIndex(c => c.id === activeCameraId); setActiveCameraId(cameras[(idx + 1) % cameras.length].id); }}>
                      <SwitchCamera size={16} /> Flip Camera
                    </button>
                  )}
                  <button className="btn-secondary" style={{ padding: '12px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                    onClick={() => isScanning ? stopCamera() : startCamera()}>
                    {isScanning ? <><Square size={16} /> Pause</> : <><Play size={16} /> Resume</>}
                  </button>
                </div>
              </div>
            )}

            {scanMode === 'upload' && (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: 300, maxWidth: 420, margin: '0 auto', background: 'var(--paper-bg)', border: '3px dashed var(--purple-main)', borderRadius: 16, cursor: 'pointer' }}>
                <Upload size={48} color="var(--purple-main)" />
                <div style={{ textAlign: 'center' }}>
                  <p className="marker-font" style={{ fontSize: 24, color: 'var(--purple-main)', marginBottom: 8 }}>Drop QR Image Here</p>
                  <p style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>Screenshot, photo, or E-Pass PNG</p>
                </div>
                <div className="btn-primary" style={{ padding: '12px 24px', fontSize: 14 }}>Select File</div>
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            )}

            {scanMode === 'manual' && (
              <div style={{ maxWidth: 420, margin: '0 auto', padding: '20px 0' }}>
                <p style={{ fontSize: 15, color: '#4B5563', marginBottom: 24, fontWeight: 600, textAlign: 'center' }}>Enter the ticket code printed on the pass</p>
                <form onSubmit={(e) => { e.preventDefault(); handleVerify(manualCode.trim()); setManualCode(''); }}>
                  <input className="pg-input" style={{ fontSize: 18, fontFamily: 'var(--font-mono)', textAlign: 'center', textTransform: 'uppercase', marginBottom: 20 }}
                    value={manualCode} onChange={e => setManualCode(e.target.value.toUpperCase())} placeholder="PASS-GEN-8421" autoFocus />
                  <button type="submit" disabled={verifying} className="btn-success" style={{ width: '100%', padding: '16px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    {verifying ? <><Loader size={20} className="animate-spin" /> Verifying…</> : <><CheckCircle2 size={20} /> Verify Ticket</>}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Rules Sidebar */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <h4 className="marker-font" style={{ fontSize: 24, color: 'var(--black-ink)', marginBottom: 20 }}>Gate Rules</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { col: '#10B981', icon: '1', title: 'First Scan Grants Entry', desc: 'Pass is permanently locked in the database.' },
              { col: '#F59E0B', icon: '2', title: 'Duplicate Alert', desc: 'Second attempt shows prior entry timestamp.' },
              { col: '#EF4444', icon: '3', title: 'Fakes Rejected', desc: 'Codes not in the database are denied instantly.' },
            ].map((r, i) => (
              <div key={i} className="paper-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: r.col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white', flexShrink: 0 }}>{r.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--black-ink)' }}>{r.title}</span>
                </div>
                <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5, paddingLeft: 40, fontWeight: 500 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RESULT MODAL */}
      {result && (() => {
        const cfg = STATUS_CONFIG[result.status] || STATUS_CONFIG.INVALID;
        return (
          <div 
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
            style={{ 
              position: 'fixed', 
              inset: 0, 
              zIndex: 300, 
              background: 'rgba(0,0,0,0.65)', 
              backdropFilter: 'blur(8px)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: 24 
            }}
          >
            <div className="paper-card" style={{ width: '100%', maxWidth: 440, background: 'white', padding: 0, overflow: 'hidden', border: `4px solid ${cfg.border}`, position: 'relative' }}>
              
              {/* Close Button Top-Right */}
              <button 
                onClick={closeModal}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.1)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--black-ink)',
                  zIndex: 10,
                  transition: 'background 0.2s'
                }}
                title="Close"
              >
                <X size={20} />
              </button>

              <div style={{ padding: '36px 32px 28px', textAlign: 'center', background: cfg.bg, borderBottom: `2px dashed ${cfg.border}` }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 76, height: 76, background: 'white', border: `3px solid ${cfg.border}`, borderRadius: '50%', marginBottom: 16 }}>
                  {cfg.icon}
                </div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 800, color: cfg.color, letterSpacing: '0.1em', marginBottom: 6 }}>{cfg.sub}</div>
                <h2 className="marker-font" style={{ fontSize: 34, color: 'var(--black-ink)', lineHeight: 1 }}>{cfg.label}</h2>
                {result.attendee?.name && <p style={{ fontSize: 18, color: 'var(--black-ink)', fontWeight: 700, marginTop: 10 }}>{result.attendee.name}</p>}
              </div>

              <div style={{ padding: '24px 32px' }}>
                {result.attendee && (
                  <div style={{ background: '#F9FAFB', border: '2px solid #E5E7EB', borderRadius: 8, padding: '16px', marginBottom: 24 }}>
                    {[
                      { label: 'Pass Category', value: result.attendee.tier },
                      { label: 'Ticket Code',   value: result.attendee.code },
                      { label: 'Seat / Zone',   value: result.attendee.seat || 'General' },
                      result.status === 'DUPLICATE' && { label: 'Originally Scanned',  value: new Date(result.firstCheckedInAt).toLocaleString() },
                      result.status === 'SUCCESS'   && { label: 'Checked In At',       value: new Date(result.checkedInAt).toLocaleTimeString() },
                    ].filter(Boolean).map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed #D1D5DB' }}>
                        <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 700 }}>{row.label}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--black-ink)', fontFamily: row.label.includes('Code') ? 'var(--font-mono)' : 'inherit' }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: 12 }}>
                  {result.status === 'DUPLICATE' && (
                    <button 
                      disabled={resetting}
                      className="btn-secondary" 
                      style={{ flex: '0 0 auto', padding: '14px 20px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
                      onClick={() => handleResetCheckIn(result.attendee?.id)}
                    >
                      <CornerUpLeft size={18} /> {resetting ? 'Resetting…' : 'Reset Check-In'}
                    </button>
                  )}
                  <button 
                    className="btn-primary" 
                    style={{ flex: 1, padding: '14px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onClick={closeModal}
                  >
                    Scan Next Pass <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
