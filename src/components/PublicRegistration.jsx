import React, { useState } from 'react';
import { storage, PASS_TIERS } from '../services/storage';
import { sound } from '../services/audio';
import { UserPlus, CheckCircle2, AlertCircle, Loader, ArrowLeft } from 'lucide-react';

export default function PublicRegistration({ onNavigate, onBack }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', tier: 'GENERAL' });
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Full name is required.'); sound.playWarning(); return; }
    if (!form.email.trim() && !form.phone.trim()) { setError('Either email or phone is required.'); sound.playWarning(); return; }
    setSaving(true);
    try {
      // Send as PENDING so admins have to approve
      const att = await storage.addAttendee({ ...form, status: 'PENDING' });
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
      <div style={{ width: '100%', maxWidth: 500, display: 'flex', justifyContent: 'flex-start', marginBottom: 20, zIndex: 20, position: 'relative' }}>
        <button 
          onClick={() => onBack ? onBack() : onNavigate('landing')}
          style={{ background: 'var(--card-bg)', border: '2px solid var(--black-ink)', padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, color: 'var(--black-ink)', boxShadow: '2px 2px 0 var(--black-ink)' }}
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 40, zIndex: 10, position: 'relative' }}>
        <h1 className="marker-font" style={{ fontSize: 48, color: 'var(--purple-main)', lineHeight: 1, transform: 'rotate(-2deg)' }}>
          GRAB YOUR PASS
        </h1>
        <div style={{ display: 'inline-block', background: 'var(--yellow-marker)', color: 'var(--black-ink)', padding: '4px 16px', fontWeight: 800, transform: 'rotate(2deg)', marginTop: 8, border: '2px solid var(--black-ink)', boxShadow: '2px 2px 0 var(--black-ink)' }}>
          STEP 1: PAY. STEP 2: REGISTER.
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 500, zIndex: 10, position: 'relative' }}>
        {submitted ? (
          <div className="paper-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, background: '#EFF6FF', border: '3px solid #3B82F6' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <CheckCircle2 size={40} />
            </div>
            <h2 className="marker-font" style={{ fontSize: 32, color: '#1E3A8A', textAlign: 'center' }}>Pass Requested!</h2>
            <p style={{ fontSize: 16, color: '#1E40AF', textAlign: 'center', fontWeight: 500 }}>
              Thanks, <strong>{submitted.name}</strong>! Your registration is now pending approval.
            </p>
            <p style={{ fontSize: 15, color: '#1E3A8A', textAlign: 'center' }}>
              Once the organizers verify your payment, you'll be able to log in and view your E-Ticket.
            </p>
            <button onClick={() => onNavigate('auth')} className="btn-primary" style={{ marginTop: 20, padding: '12px 24px', fontSize: 15 }}>
              Go to Login Page
            </button>
          </div>
        ) : (
          <div className="paper-card" style={{ padding: '40px' }}>
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
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--purple-main)', marginBottom: 8, textTransform: 'uppercase' }}>Full Name *</label>
                <input className="pg-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="E.g. Rahul Sharma" autoFocus />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--purple-main)', marginBottom: 8, textTransform: 'uppercase' }}>Email</label>
                  <input className="pg-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="rahul@example.com" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--purple-main)', marginBottom: 8, textTransform: 'uppercase' }}>Phone</label>
                  <input className="pg-input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--purple-main)', marginBottom: 8, textTransform: 'uppercase' }}>Pass Type</label>
                <div style={{ background: '#FAF5FF', border: '2px solid var(--black-ink)', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '2px 2px 0 var(--black-ink)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>🎟️</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--black-ink)' }}>Fresher Party Pass</div>
                      <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>All-Access Entry & Dinner</div>
                    </div>
                  </div>
                  <span style={{ background: 'var(--yellow-marker)', border: '1.5px solid var(--black-ink)', padding: '4px 10px', borderRadius: 6, fontWeight: 800, fontSize: 13, color: 'var(--black-ink)' }}>₹350</span>
                </div>
              </div>

              {/* PAYMENT INFO */}
              <div style={{ background: '#EFF6FF', border: '2px dashed #3B82F6', borderRadius: 8, padding: 16, display: 'flex', gap: 16, alignItems: 'center', marginTop: 10 }}>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=cyash4867@oksbi&pn=Yash%20Chaudhari&am=350&cu=INR" alt="UPI QR Code" style={{ borderRadius: 8, width: 80, height: 80, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 800, color: '#1D4ED8', fontSize: 16, marginBottom: 4 }}>Pass Price: ₹350/-</p>
                  <p style={{ fontSize: 13, color: '#1E3A8A', marginBottom: 8, fontWeight: 500 }}>Scan & pay before submitting.</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, background: 'white', padding: '4px 8px', border: '1px solid #BFDBFE', borderRadius: 6, display: 'inline-block', margin: 0 }}>cyash4867@oksbi</p>
                </div>
              </div>

              <button type="submit" disabled={saving} className="btn-success" style={{ padding: '16px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
                {saving ? <><Loader size={20} className="animate-spin" /> Saving...</> : <><UserPlus size={20} /> Request Pass</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
