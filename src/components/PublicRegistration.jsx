import React, { useState } from 'react';
import { storage, PASS_TIERS } from '../services/storage';
import { sound } from '../services/audio';
import { UserPlus, CheckCircle2, AlertCircle, Loader, ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react';
import qrImage from '../assets/qr.jpeg';

export default function PublicRegistration({ onNavigate, onBack }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', transactionId: '', tier: 'GENERAL' });
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const UPI_ID = 'dabhiprit8770@oksbi';
  const PAYEE_NAME = 'Prit Dabhi';
  const AMOUNT = 350;
  const UPI_URL = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${AMOUNT}&cu=INR&tn=FresherPartyPass`;

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    sound.playClick();
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Full name is required.'); sound.playWarning(); return; }
    if (!form.email.trim() && !form.phone.trim()) { setError('Either email or phone is required.'); sound.playWarning(); return; }
    if (!form.transactionId.trim()) { 
      setError('Please enter your 12-digit UPI Transaction ID / UTR number after paying ₹350.'); 
      sound.playWarning(); 
      return; 
    }

    setSaving(true);
    try {
      // Send as PENDING so admins have to verify UTR and approve
      const att = await storage.addAttendee({ 
        ...form, 
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        transactionId: form.transactionId.trim(),
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

      <div style={{ textAlign: 'center', marginBottom: 32, zIndex: 10, position: 'relative' }}>
        <h1 className="marker-font" style={{ fontSize: 44, color: 'var(--purple-main)', lineHeight: 1, transform: 'rotate(-2deg)' }}>
          GRAB YOUR PASS
        </h1>
        <div style={{ display: 'inline-block', background: 'var(--yellow-marker)', color: 'var(--black-ink)', padding: '4px 16px', fontWeight: 800, transform: 'rotate(2deg)', marginTop: 8, border: '2px solid var(--black-ink)', boxShadow: '2px 2px 0 var(--black-ink)', fontSize: 13 }}>
          STEP 1: SCAN & PAY ₹350 → STEP 2: ENTER UTR → STEP 3: GET PASS
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
              Thanks, <strong>{submitted.name}</strong>! Your registration has been received.
            </p>
            <div style={{ background: 'white', border: '2px dashed #93C5FD', borderRadius: 8, padding: '12px 16px', width: '100%', textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 4px', fontWeight: 700 }}>SUBMITTED TRANSACTION ID / UTR:</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 900, color: '#1E40AF', margin: 0 }}>{submitted.transactionId || form.transactionId}</p>
            </div>
            <p style={{ fontSize: 14, color: '#1E3A8A', textAlign: 'center', lineHeight: 1.5 }}>
              Once organizers verify your payment against this UTR, your E-Ticket with QR code will be activated.
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

              {/* ─── SECTION 2: Payment Details with Direct UPI & QR ─── */}
              <div style={{ background: '#F8FAFC', border: '2px solid var(--black-ink)', borderRadius: 12, padding: '20px', boxShadow: '3px 3px 0 var(--black-ink)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--black-ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    💳 Step 1: Scan & Pay ₹350
                  </span>
                  <span style={{ background: 'var(--yellow-marker)', border: '1.5px solid var(--black-ink)', padding: '2px 8px', borderRadius: 4, fontWeight: 900, fontSize: 13 }}>
                    ₹350/-
                  </span>
                </div>

                {/* Direct UPI Trigger Button for Mobile */}
                <a 
                  href={UPI_URL}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: 'white', border: '2px solid var(--black-ink)', borderRadius: 8,
                    padding: '12px 16px', fontWeight: 800, fontSize: 14, textDecoration: 'none',
                    boxShadow: '2px 2px 0 var(--black-ink)', marginBottom: 16
                  }}
                >
                  <ExternalLink size={18} />
                  <span>⚡ Pay ₹350 via Google Pay / Any UPI App</span>
                </a>

                {/* QR Code and UPI ID */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'white', border: '1.5px dashed #CBD5E1', borderRadius: 8, padding: 12 }}>
                  <img 
                    src={qrImage} 
                    alt="Google Pay QR Code - Prit Dabhi" 
                    style={{ borderRadius: 8, width: 110, height: 110, objectFit: 'contain', border: '1px solid #E2E8F0', flexShrink: 0, background: '#F8FAFC' }} 
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', margin: '0 0 2px' }}>{PAYEE_NAME}</p>
                    <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 8px' }}>Google Pay / Any UPI App</p>
                    
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, padding: '4px 8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{UPI_ID}</span>
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

              {/* ─── SECTION 3: Transaction ID Input ─── */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--purple-main)', marginBottom: 6, textTransform: 'uppercase' }}>
                  🔑 Step 2: UPI Transaction ID / UTR Number *
                </label>
                <input 
                  className="pg-input" 
                  required 
                  value={form.transactionId} 
                  onChange={e => setForm({ ...form, transactionId: e.target.value })} 
                  placeholder="E.g. 423589123456 (12-digit UTR from GPay / PhonePe)" 
                />
                <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: 500, lineHeight: 1.4 }}>
                  💡 Check your GPay/UPI payment receipt for <strong>UPI Ref No / UTR</strong> and paste it here so organizers can verify and approve your ticket.
                </p>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={saving} 
                className="btn-success" 
                style={{ padding: '16px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 4 }}
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
