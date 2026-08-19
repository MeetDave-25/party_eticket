import React, { useEffect, useState } from 'react';
import { storage } from '../services/storage';
import { sound } from '../services/audio';
import PassCard from './PassCard';
import { LogOut, Calendar, MapPin, Bell, User } from 'lucide-react';

export default function UserPortal({ eventInfo, onLogout, onNavigate }) {
  const [activeUser, setActiveUser] = useState(() => storage.getActiveUser());
  const [loading, setLoading] = useState(!activeUser);

  const refreshUserData = async () => {
    const cur = storage.getActiveUser();
    if (!cur) {
      if (onNavigate) onNavigate('auth');
      else if (onLogout) onLogout();
      return;
    }

    try {
      // Look up fresh data ONLY for the current active user
      const fresh = await storage.findAttendeeByIdentifier(cur.id || cur.code);
      if (fresh) {
        storage.setActiveUser(fresh);
        setActiveUser(fresh);
      } else {
        // If not found (e.g. deleted), log out
        storage.clearActiveUser();
        if (onNavigate) onNavigate('auth');
        else if (onLogout) onLogout();
      }
    } catch (err) {
      console.warn('Failed to refresh attendee data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cur = storage.getActiveUser();
    if (!cur) {
      if (onNavigate) onNavigate('auth');
      else if (onLogout) onLogout();
      return;
    }
    setActiveUser(cur);
    setLoading(false);

    refreshUserData();
    window.addEventListener('passguard_data_change', refreshUserData);
    return () => window.removeEventListener('passguard_data_change', refreshUserData);
  }, []);

  if (!activeUser || loading) {
    return (
      <div className="doodle-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="paper-card" style={{ padding: '32px', textAlign: 'center', maxWidth: 400 }}>
          <h3 className="marker-font" style={{ fontSize: 24, color: 'var(--purple-main)', marginBottom: 12 }}>Access Required</h3>
          <p style={{ fontSize: 14, color: '#4B5563', marginBottom: 20 }}>Please log in to view your E-Pass ticket.</p>
          <button onClick={() => onNavigate ? onNavigate('auth') : onLogout()} className="btn-primary" style={{ width: '100%', padding: '12px' }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="doodle-bg" style={{ minHeight: '100vh', padding: '40px 20px' }}>
      
      {/* Header */}
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h2 className="marker-font" style={{ fontSize: 32, color: 'var(--purple-main)', lineHeight: 1, transform: 'rotate(-2deg)' }}>VASTEGUNA HUIYAA</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--black-ink)', background: 'var(--yellow-marker)', display: 'inline-block', padding: '2px 8px', transform: 'rotate(1deg)' }}>E-PASS PORTAL</p>
        </div>

        {/* User Identity Pill & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: 'white',
            border: '2px solid var(--black-ink)',
            borderRadius: 8,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--black-ink)',
            boxShadow: '2px 2px 0 var(--black-ink)'
          }}>
            <User size={15} color="var(--purple-main)" />
            <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeUser.name}
            </span>
          </div>

          <button 
            onClick={() => { sound.playClick(); onLogout(); }} 
            className="btn-secondary" 
            style={{ padding: '8px 14px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} 
            title="Log Out"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40 }}>
        
        {/* Left Col - The Pass */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <PassCard attendee={activeUser} eventInfo={eventInfo} />
        </div>

        {/* Right Col - Updates & Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Welcome Card */}
          <div className="paper-card" style={{ padding: '24px' }}>
            <div className="tape top-center" style={{ width: 60, transform: 'rotate(3deg)' }} />
            <h3 className="marker-font" style={{ fontSize: 24, marginBottom: 8, color: 'var(--black-ink)' }}>Hi, {activeUser.name.split(' ')[0]}! 👋</h3>
            <p style={{ fontSize: 15, color: '#4B5563', lineHeight: 1.5 }}>
              Your E-Pass is ready. Save the ticket image or take a screenshot. You will need to scan the QR code at the entrance gate. 
            </p>
          </div>

          {/* Event Updates */}
          <div className="paper-card" style={{ padding: '24px', background: 'rgba(107,33,168,0.03)' }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--purple-main)', letterSpacing: '0.1em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={16} /> LATEST UPDATES
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ background: 'var(--yellow-marker)', color: 'var(--black-ink)', padding: '6px', borderRadius: 8, height: 'fit-content' }}><MapPin size={18} /></div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>Venue Announced!</p>
                  <p style={{ fontSize: 14, color: '#4B5563', marginTop: 2 }}>We're partying at the <strong>Main Campus Ground</strong>. Follow the neon signs from the north gate.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ background: 'white', border: '2px solid var(--black-ink)', color: 'var(--purple-main)', padding: '6px', borderRadius: 8, height: 'fit-content' }}><Calendar size={18} /></div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>Dress Code: Your Best Fit</p>
                  <p style={{ fontSize: 14, color: '#4B5563', marginTop: 2 }}>Zindagi ek hi hai, par vibes legendary honi chahiye! Come dressed to impress.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div style={{ background: 'white', border: '2px dashed var(--black-ink)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', marginBottom: 8 }}>NEED HELP?</p>
            <p style={{ fontSize: 15, fontWeight: 600 }}>Contact the Organisers:</p>
            <p className="marker-font" style={{ fontSize: 18, color: 'var(--purple-main)', marginTop: 4 }}>Dhawan: 9714509181</p>
            <p className="marker-font" style={{ fontSize: 18, color: 'var(--purple-main)' }}>Jadav: 9624487630</p>
          </div>

        </div>
      </div>

    </div>
  );
}
