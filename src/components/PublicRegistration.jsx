import React, { useState } from 'react';
import { storage } from '../services/storage';
import { sound } from '../services/audio';
import { UserPlus, CheckCircle2, AlertCircle, Loader, ArrowLeft, ExternalLink, Copy, Check, Upload, Image as ImageIcon, X } from 'lucide-react';
import qrImage from '../assets/qr.jpeg';

export default function PublicRegistration({ onNavigate, onBack }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', transactionId: '', tier: 'GENERAL' });
  const [paymentProof, setPaymentProof] = useState(null); // base64 string
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const UPI_ID = '9510479002@ptsbi';
  const PAYEE_NAME = 'Dabhi Prit Dhanjibhai';
  const AMOUNT = 350;
  const UPI_URL = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${AMOUNT}&cu=INR&tn=FresherPartyPass`;

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    sound.playClick();
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Compress and convert uploaded image to base64
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, etc.).');
      sound.playWarning();
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        
        setPaymentProof(compressedBase64);
        sound.playSuccess();
        setError('');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Full name is required.'); sound.playWarning(); return; }
    if (!form.email.trim() && !form.phone.trim()) { setError('Either email or phone is required.'); sound.playWarning(); return; }
    if (!paymentProof && !form.transactionId.trim()) { 
      setError('Please upload a screenshot of your ₹350 payment receipt or enter the UTR.'); 
      sound.playWarning(); 
      return; 
    }

    setSaving(true);
    try {
      // Send as PENDING so admins have to verify screenshot and approve
      const att = await storage.addAttendee({ 
        ...form, 
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        transactionId: form.transactionId.trim(),
        paymentProof: paymentProof || null,
        status: 'PENDING' 
      });
      sound.playSuccess();
      setSubmitted(att);
    } catch (err) {
      setError(err.message.replace(/^Failed to save:\s*/, ''));
      sound.playWarning();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="doodle-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      
      {/* Back Button */}
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', justifyContent: 'flex-start', marginBottom: 20, zIndex: 20, position: 'relative' }}>
        <button 
          onClick={() => onBack ? onBack() : onNavigate('landing')}
          style={{ background: 'var(--card-bg)', border: '2px solid var(--black-ink)', padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, color: 'var(--black-ink)', boxShadow: '2px 2px 0 var(--black-ink)' }}
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 28, zIndex: 10, position: 'relative' }}>
        <h1 className="marker-font" style={{ fontSize: 44, color: 'var(--purple-main)', lineHeight: 1, transform: 'rotate(-2deg)' }}>
          GRAB YOUR PASS
        </h1>
        <div style={{ display: 'inline-block', background: 'var(--yellow-marker)', color: 'var(--black-ink)', padding: '4px 16px', fontWeight: 800, transform: 'rotate(2deg)', marginTop: 8, border: '2px solid var(--black-ink)', boxShadow: '2px 2px 0 var(--black-ink)', fontSize: 13 }}>
          STEP 1: SCAN & PAY ₹350 → STEP 2: UPLOAD RECEIPT → STEP 3: GET PASS
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 520, zIndex: 10, position: 'relative' }}>
        {submitted ? (
          <div className="paper-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, background: '#EFF6FF', border: '3px solid #3B82F6' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <CheckCircle2 size={40} />
            </div>
            <h2 className="marker-font" style={{ fontSize: 32, color: '#1E3A8A', textAlign: 'center', margin: 0 }}>Pass Requested!</h2>
            <p style={{ fontSize: 16, color: '#1E40AF', textAlign: 'center', fontWeight: 600, margin: 0 }}>
              Thanks, <strong>{submitted.name}</strong>! Your registration and payment proof have been received.
            </p>
            
            {paymentProof && (
              <div style={{ background: 'white', border: '2px dashed #93C5FD', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 6px', fontWeight: 700 }}>UPLOADED PAYMENT RECEIPT:</p>
                <img src={paymentProof} alt="Payment Proof Preview" style={{ maxHeight: 140, borderRadius: 6, border: '1px solid #BFDBFE' }} />
              </div>
            )}

            <p style={{ fontSize: 14, color: '#1E3A8A', textAlign: 'center', lineHeight: 1.5 }}>
              Once organizers verify your payment receipt, your E-Ticket with gate QR code will be activated.
            </p>
            <button onClick={() => onNavigate('auth')} className="btn-primary" style={{ marginTop: 10, padding: '12px 24px', fontSize: 15 }}>
              Go to Login Page
            </button>
          </div>
        ) : (
          <div className="paper-card" style={{ padding: '32px 28px' }}>
            <div className="tape top-center" style={{ width: 80, transform: 'rotate(-2deg)' }} />
            
            {error && (
              <div style={{ background: '#FEE2E2', border: '2px dashed #EF4444', borderRadius: 8, padding: '14px 16px', marginBottom: 24, color: '#B91C1C' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, fontWeight: 700 }}>{error}</span>
                </div>
                {error.toLowerCase().includes('already registered') && (
                  <button 
                    onClick={() => onNavigate('auth')} 
                    className="btn-primary" 
                    style={{ marginTop: 12, padding: '8px 16px', fontSize: 13, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    Go to Login Page →
                  </button>
                )}
              </div>
            )}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              {/* ─── SECTION 1: Personal Details ─── */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--purple-main)', marginBottom: 8, textTransform: 'uppercase' }}>Full Name *</label>
                <input className="pg-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="E.g. Rahul Sharma" autoFocus />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--purple-main)', marginBottom: 8, textTransform: 'uppercase' }}>Email *</label>
                  <input className="pg-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="rahul@example.com" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--purple-main)', marginBottom: 8, textTransform: 'uppercase' }}>Phone *</label>
                  <input className="pg-input" type="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
                </div>
              </div>

              {/* ─── SECTION 2: Paytm Payment Card View ─── */}
              <div style={{ background: '#F8FAFC', border: '2px solid var(--black-ink)', borderRadius: 12, padding: '20px', boxShadow: '3px 3px 0 var(--black-ink)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--black-ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    💳 Step 1: Scan & Pay ₹350
                  </span>
                  <span style={{ background: 'var(--yellow-marker)', border: '1.5px solid var(--black-ink)', padding: '2px 8px', borderRadius: 4, fontWeight: 900, fontSize: 13 }}>
                    ₹350/-
                  </span>
                </div>

                {/* Direct 1-Click UPI Payment Button for Mobile */}
                <a 
                  href={UPI_URL}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: 'white', border: '2px solid var(--black-ink)', borderRadius: 8,
                    padding: '13px 16px', fontWeight: 800, fontSize: 14.5, textDecoration: 'none',
                    boxShadow: '2px 2px 0 var(--black-ink)', marginBottom: 16
                  }}
                >
                  <ExternalLink size={18} />
                  <span>⚡ Pay ₹350 via Google Pay / Paytm / Any UPI</span>
                </a>

                {/* Centered Paytm QR Card */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', border: '1.5px dashed #CBD5E1', borderRadius: 10, padding: 16 }}>
                  <img 
                    src={qrImage} 
                    alt="Paytm QR Code - Dabhi Prit Dhanjibhai" 
                    style={{ width: '100%', maxWidth: 240, maxHeight: 300, objectFit: 'contain', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} 
                  />

                  <div style={{ marginTop: 14, textAlign: 'center', width: '100%' }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', margin: '0 0 2px' }}>{PAYEE_NAME}</p>
                    <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 8px' }}>Scan with Paytm, Google Pay, PhonePe, or BHIM</p>
                    
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, padding: '4px 10px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 800, color: '#0F172A' }}>{UPI_ID}</span>
                      <button 
                        type="button" 
                        onClick={copyUpiId}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: copiedUpi ? '#10B981' : '#64748B' }}
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── SECTION 3: Upload Payment Screenshot ─── */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--purple-main)', marginBottom: 8, textTransform: 'uppercase' }}>
                  📷 Step 2: Upload Payment Screenshot *
                </label>
                
                {paymentProof ? (
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: 14, background: '#F0FDF4', 
                    border: '2px solid #10B981', borderRadius: 10, padding: 14 
                  }}>
                    <img 
                      src={paymentProof} 
                      alt="Uploaded Receipt" 
                      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #10B981' }} 
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#065F46', margin: '0 0 2px' }}>
                        ✓ Screenshot Attached!
                      </p>
                      <p style={{ fontSize: 12, color: '#047857', margin: 0 }}>
                        Ready to submit with your registration.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentProof(null)}
                      style={{ 
                        background: '#FEE2E2', border: '1px solid #EF4444', color: '#B91C1C', 
                        borderRadius: 6, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' 
                      }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 8, padding: '24px 16px', background: '#F8FAFC', border: '2px dashed #94A3B8',
                    borderRadius: 10, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s'
                  }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                      <Upload size={22} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--black-ink)' }}>
                      Tap to Upload Payment Screenshot
                    </span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>
                      Supports photos from camera or gallery (JPEG, PNG)
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                )}
              </div>

              {/* Optional UTR / Reference */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase' }}>
                  UPI Ref / UTR No. (Optional)
                </label>
                <input 
                  className="pg-input" 
                  value={form.transactionId} 
                  onChange={e => setForm({ ...form, transactionId: e.target.value })} 
                  placeholder="E.g. 423589123456" 
                  style={{ fontSize: 13, padding: '10px 14px' }}
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={saving} 
                className="btn-success" 
                style={{ padding: '16px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 6 }}
              >
                {saving ? <><Loader size={20} className="animate-spin" /> Submitting Request...</> : <><UserPlus size={20} /> Submit & Request Pass</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
