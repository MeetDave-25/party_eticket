import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { sound } from '../services/audio';
import { User, Shield, ArrowRight, Loader, ArrowLeft } from 'lucide-react';

export default function AuthPage({ onNavigate, onLoginSuccess, defaultTab = 'attendee' }) {
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Real life admin credentials default to the organisers on the poster
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Switch between attendee and admin login
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleAttendeeLogin = async (e) => {
    e?.preventDefault();
    setLoginError('');
    if (!loginInput.trim()) {
      setLoginError('Please enter your email, phone, or ticket code.');
      sound.playWarning();
      return;
    }
    setLoginLoading(true);
    try {
      const found = await storage.findAttendeeByIdentifier(loginInput.trim());
      if (found) {
        sound.playSuccess();
        storage.setActiveUser(found);
        onLoginSuccess('user', found);
      } else {
        sound.playError();
        setLoginError(`Whoops! We couldn't find a pass for "${loginInput}".`);
      }
    } catch {
      setLoginError('Server error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };


  const handleAdminLogin = async (e) => {
    e?.preventDefault();
    setAdminError('');
    if (adminEmail === 'admin@vasteguna.com' && adminPassword === 'admin123') {
      sound.playSuccess();
      onLoginSuccess('admin');
    } else {
      sound.playError();
      setAdminError('Invalid admin credentials.');
    }
  };

  return (
    <div className="doodle-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      
      {/* Back Button Container */}
      <div style={{ width: '100%', maxWidth: 440, display: 'flex', justifyContent: 'flex-start', marginBottom: 20, zIndex: 20, position: 'relative' }}>
        <button 
          onClick={() => onNavigate('landing')}
          style={{ background: 'var(--card-bg)', border: '2px solid var(--black-ink)', padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, color: 'var(--black-ink)', boxShadow: '2px 2px 0 var(--black-ink)' }}
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {/* ─── Background Scrapbook Decorations (Desktop Only) ─── */}
      <div className="hidden md:block pointer-events-none" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {/* Top Left */}
        <div style={{ position: 'absolute', top: '15%', left: '10%', transform: 'rotate(-12deg)' }}>
          <div className="paper-card" style={{ padding: '8px 16px', background: 'var(--yellow-marker)', color: '#111827' }}>
            <div className="tape top-center" style={{ width: 60, top: -10 }} />
            <span className="marker-font" style={{ fontSize: 22 }}>VIP ENTRY ONLY</span>
          </div>
        </div>
        
        {/* Bottom Left */}
        <div style={{ position: 'absolute', bottom: '20%', left: '12%', transform: 'rotate(15deg)' }}>
          <span style={{ fontSize: 70, filter: 'drop-shadow(2px 4px 0 rgba(0,0,0,0.2))' }}>🪩</span>
        </div>
        
        {/* Top Right */}
        <div style={{ position: 'absolute', top: '18%', right: '12%', transform: 'rotate(20deg)' }}>
          <span style={{ fontSize: 60, filter: 'drop-shadow(2px 4px 0 rgba(0,0,0,0.2))' }}>🎶</span>
        </div>
        
        {/* Bottom Right */}
        <div style={{ position: 'absolute', bottom: '22%', right: '8%', transform: 'rotate(-8deg)' }}>
          <div className="paper-card" style={{ padding: '12px 20px', background: '#FEE2E2', borderStyle: 'dashed', color: '#111827' }}>
             <div className="tape top-center" style={{ width: 60, top: -10 }} />
             <span className="marker-font" style={{ fontSize: 20, color: 'var(--purple-main)' }}>Are you ready? 🔥</span>
          </div>
        </div>

        {/* Floating Stars */}
        <span className="reveal-pulse" style={{ position: 'absolute', top: '45%', left: '6%', fontSize: 34 }}>✨</span>
        <span className="reveal-pulse" style={{ position: 'absolute', top: '55%', right: '15%', fontSize: 40, animationDelay: '1s' }}>✨</span>
      </div>

      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: 40, cursor: 'pointer', zIndex: 10, position: 'relative' }} onClick={() => onNavigate('landing')}>
        <h1 className="marker-font" style={{ fontSize: 48, color: 'var(--purple-main)', lineHeight: 1, transform: 'rotate(-2deg)' }}>
          VASTEGUNA HUIYAA
        </h1>
        <div style={{ display: 'inline-block', background: 'var(--yellow-marker)', color: 'var(--black-ink)', padding: '4px 16px', fontWeight: 800, transform: 'rotate(2deg)', marginTop: 8, border: '2px solid var(--black-ink)', boxShadow: '2px 2px 0 var(--black-ink)' }}>
          FRESHERS EDITION
        </div>
      </div>

      <div className="paper-card" style={{ width: '100%', maxWidth: 440, padding: '30px 40px', marginTop: 10, zIndex: 10, position: 'relative' }}>
        <div className="tape top-center" />
        
        {/* Tab Switcher */}
        <div style={{ display: 'flex', marginBottom: 28, borderBottom: '2px solid rgba(17,24,39,0.1)' }}>
          <button onClick={() => { setActiveTab('attendee'); sound.playClick(); }}
            style={{ flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: activeTab === 'attendee' ? '3px solid var(--purple-main)' : '3px solid transparent', color: activeTab === 'attendee' ? 'var(--purple-main)' : '#6B7280', fontWeight: 700, fontFamily: 'var(--font-body)', fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}>
            <User size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} /> Attendee
          </button>
          <button onClick={() => { setActiveTab('admin'); sound.playClick(); }}
            style={{ flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: activeTab === 'admin' ? '3px solid var(--purple-main)' : '3px solid transparent', color: activeTab === 'admin' ? 'var(--purple-main)' : '#6B7280', fontWeight: 700, fontFamily: 'var(--font-body)', fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}>
            <Shield size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} /> Organiser
          </button>
        </div>

        {/* ─── ATTENDEE TAB ─── */}
        {activeTab === 'attendee' && (
          <div>
            {loginError && (
              <div style={{ background: '#FEE2E2', border: '2px solid #EF4444', padding: '10px 14px', borderRadius: 6, color: '#B91C1C', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleAttendeeLogin}>
              <p style={{ fontSize: 14, color: '#4B5563', marginBottom: 16, fontWeight: 500 }}>Enter your email, phone, or ticket code to view your E-Pass.</p>
              <input className="pg-input" style={{ marginBottom: 20 }} value={loginInput} onChange={e => setLoginInput(e.target.value)} placeholder="e.g. 9714509181 or PASS-GEN-123" autoFocus />
              <button type="submit" disabled={loginLoading} className="btn-primary" style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loginLoading ? <Loader size={18} className="animate-spin" /> : <>Get My Pass <ArrowRight size={18} /></>}
              </button>
            </form>
          </div>
        )}

        {/* ─── ADMIN TAB ─── */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminLogin}>
            {adminError && (
              <div style={{ background: '#FEE2E2', border: '2px solid #EF4444', padding: '10px 14px', borderRadius: 6, color: '#B91C1C', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
                {adminError}
              </div>
            )}
            <p style={{ fontSize: 14, color: '#4B5563', marginBottom: 16, fontWeight: 500 }}>Organiser login required for gate scanning and analytics.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              <input className="pg-input" type="email" required value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="Organiser Email" autoFocus />
              <input className="pg-input" type="password" required value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Password" />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Open Gate Scanner <ArrowRight size={18} />
            </button>
          </form>
        )}

      </div>
      
      <div style={{ marginTop: 30, textAlign: 'center', zIndex: 10, position: 'relative' }}>
        <p style={{ fontSize: 13, color: '#6B7280', fontWeight: 500, marginBottom: 12 }}>Organised by Dhawan Satani & Jadav Dashrath</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--card-bg)', padding: '6px 16px', borderRadius: 20, border: '1px dashed var(--purple-main)', boxShadow: '2px 2px 0 rgba(0,0,0,0.1)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Code & Vibes crafted by</span>
          <span className="marker-font" style={{ fontSize: 18, color: 'var(--purple-main)', transform: 'rotate(-2deg)' }}>Meet Dave</span>
        </div>
      </div>
    </div>
  );
}
