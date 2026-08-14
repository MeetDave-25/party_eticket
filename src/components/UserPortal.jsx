import React, { useEffect, useState } from 'react';
import { storage } from '../services/storage';
import { sound } from '../services/audio';
import PassCard from './PassCard';
import { LogOut, Calendar, MapPin, Bell, UserPlus, ChevronDown, Check } from 'lucide-react';

export default function UserPortal({ eventInfo, onLogout }) {
  const [activeUser, setActiveUser] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [showSwitcher, setShowSwitcher] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPass, setNewPass] = useState({ name: '', email: '', tier: 'GENERAL', company: '' });

  const load = async () => {
    const list = await storage.getAttendees();
    setAttendees(list);
    const cur = storage.getActiveUser();
    if (cur) {
      const fresh = list.find(a => a.id === cur.id || a.code === cur.code);
      setActiveUser(fresh || cur);
    } else if (list.length) setActiveUser(list[0]);
  };

  useEffect(() => {
    load();
    window.addEventListener('passguard_data_change', load);
    return () => window.removeEventListener('passguard_data_change', load);
  }, []);

  const handleSwitchUser = (att) => {
    sound.playClick();
    storage.setActiveUser(att);
    setActiveUser(att);
    setShowSwitcher(false);
  };

  const handleAddPass = async (e) => {
    e.preventDefault();
    if (!newPass.name.trim()) return;
    const created = await storage.addAttendee({ ...newPass, seat: `${newPass.tier} Access Area` });
    sound.playSuccess();
    storage.setActiveUser(created);
    setActiveUser(created);
    setShowAddModal(false);
    setNewPass({ name: '', email: '', tier: 'GENERAL', company: '' });
  };

  if (!activeUser) return <div className="doodle-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return (
    <div className="doodle-bg" style={{ minHeight: '100vh', padding: '40px 20px' }}>
      
      {/* Header */}
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h2 className="marker-font" style={{ fontSize: 32, color: 'var(--purple-main)', lineHeight: 1, transform: 'rotate(-2deg)' }}>VASTEGUNA HUIYAA</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--black-ink)', background: 'var(--yellow-marker)', display: 'inline-block', padding: '2px 8px', transform: 'rotate(1deg)' }}>E-PASS PORTAL</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* User Switcher Dropdown */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowSwitcher(!showSwitcher)} className="btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              {activeUser.name} <ChevronDown size={14} />
            </button>
            {showSwitcher && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'white', border: '2px solid var(--black-ink)', borderRadius: 8, width: 220, zIndex: 100, boxShadow: '4px 4px 0 rgba(0,0,0,0.1)' }}>
                {attendees.map(a => (
                  <button key={a.id} onClick={() => handleSwitchUser(a)} style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px dashed #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 600, color: 'var(--black-ink)' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                    {a.id === activeUser.id && <Check size={14} color="var(--purple-main)" />}
                  </button>
                ))}
                <button onClick={() => { setShowAddModal(true); setShowSwitcher(false); }} style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'var(--purple-main)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', borderBottomLeftRadius: 6, borderBottomRightRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserPlus size={14} /> Add Another Pass
                </button>
              </div>
            )}
          </div>
          <button onClick={() => { sound.playClick(); onLogout(); }} className="btn-secondary" style={{ padding: '8px', color: '#EF4444' }} title="Log Out">
            <LogOut size={16} />
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

      {/* Add Pass Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="paper-card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
            <h3 className="marker-font" style={{ fontSize: 28, color: 'var(--purple-main)', marginBottom: 20 }}>Add Another Pass</h3>
            <form onSubmit={handleAddPass} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="pg-input" required value={newPass.name} onChange={e => setNewPass({...newPass, name: e.target.value})} placeholder="Full Name" autoFocus />
              <input className="pg-input" type="email" required value={newPass.email} onChange={e => setNewPass({...newPass, email: e.target.value})} placeholder="Email" />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ flex: 1, padding: 12 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: 12 }}>Add Pass</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
