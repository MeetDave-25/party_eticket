import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { sound } from '../services/audio';
import Dashboard from './Dashboard';
import Registration from './Registration';
import Scanner from './Scanner';
import ScanLogs from './ScanLogs';
import AttendeeList from './AttendeeList';
import TicketGenerator from './TicketGenerator';
import { LayoutDashboard, Users, UserPlus, Scan, FileText, Ticket, LogOut, Menu, X } from 'lucide-react';

export default function AdminPortal({ eventInfo, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [attendees, setAttendees] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scannerCode, setScannerCode] = useState(null);

  useEffect(() => {
    const load = async () => {
      const list = await storage.getAttendees();
      setAttendees(list);
    };
    load();
    window.addEventListener('passguard_data_change', load);
    return () => window.removeEventListener('passguard_data_change', load);
  }, []);

  const NAV_ITEMS = [
    { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { id: 'scanner', icon: <Scan size={18} />, label: 'Gate Scanner' },
    { id: 'register', icon: <UserPlus size={18} />, label: 'Issue Passes' },
    { id: 'attendees', icon: <Users size={18} />, label: 'Guest List' },
    { id: 'tickets', icon: <Ticket size={18} />, label: 'E-Pass Gallery' },
    { id: 'logs', icon: <FileText size={18} />, label: 'Audit Logs' },
  ];

  return (
    <div className="doodle-bg" style={{ display: 'flex', minHeight: '100vh', background: 'var(--paper-bg)' }}>
      
      {/* Mobile Topbar */}
      <div style={{ display: 'none' }} className="mobile-topbar">
        {/* Placeholder for responsive CSS if needed */}
      </div>

      {/* Sidebar */}
      <aside style={{ width: 260, background: 'white', borderRight: '3px solid var(--black-ink)', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
        
        <div style={{ padding: '32px 24px', background: 'var(--yellow-marker)', borderBottom: '3px dashed var(--black-ink)' }}>
          <h2 className="marker-font" style={{ fontSize: 28, color: 'var(--purple-main)', lineHeight: 1, transform: 'rotate(-2deg)' }}>VASTEGUNA HUIYAA</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: 'var(--black-ink)', marginTop: 8, letterSpacing: '0.05em' }}>ORGANISER PORTAL</p>
        </div>

        <nav style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', marginBottom: 8, letterSpacing: '0.1em', paddingLeft: 8 }}>MAIN MENU</p>
          {NAV_ITEMS.map(item => {
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { sound.playClick(); setTab(item.id); setIsMobileMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8,
                  background: isActive ? 'var(--purple-main)' : 'transparent',
                  color: isActive ? 'white' : '#4B5563',
                  border: isActive ? '2px solid var(--black-ink)' : '2px solid transparent',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: isActive ? '3px 3px 0 var(--black-ink)' : 'none'
                }}
              >
                {item.icon} {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: 24, borderTop: '3px dashed var(--black-ink)' }}>
          <button onClick={() => { sound.playClick(); onLogout(); }} className="btn-secondary" style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#EF4444' }}>
            <LogOut size={16} /> Exit Portal
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {tab === 'scanner' && <Scanner initialCode={scannerCode} onClearInitialCode={() => setScannerCode(null)} />}
        {tab === 'dashboard' && <Dashboard onNavigate={setTab} onTestCode={(c) => { setScannerCode(c); setTab('scanner'); }} />}
        {tab === 'register' && <Registration eventInfo={eventInfo} onCreatedAttendee={() => setTab('attendees')} />}
        {tab === 'attendees' && <AttendeeList onTestCode={(c) => { setScannerCode(c); setTab('scanner'); }} />}
        {tab === 'tickets' && <TicketGenerator eventInfo={eventInfo} onTestCode={(c) => { setScannerCode(c); setTab('scanner'); }} />}
        {tab === 'logs' && <ScanLogs />}
      </main>

    </div>
  );
}
