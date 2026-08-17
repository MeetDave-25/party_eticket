import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { sound } from '../services/audio';
import Dashboard from './Dashboard';
import Registration from './Registration';
import Scanner from './Scanner';
import ScanLogs from './ScanLogs';
import AttendeeList from './AttendeeList';
import TicketGenerator from './TicketGenerator';
import { 
  LayoutDashboard, Users, UserPlus, Scan, FileText, Ticket, 
  LogOut, Menu, X, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen,
  ShieldCheck 
} from 'lucide-react';

export default function AdminPortal({ eventInfo, onLogout, initialScanCode, adminRole }) {
  const [tab, setTab] = useState(adminRole === 'bouncer' ? 'scanner' : 'dashboard');
  const [attendees, setAttendees] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  const ALL_NAV_ITEMS = [
    { id: 'dashboard', icon: <LayoutDashboard size={19} />, label: 'Dashboard' },
    { id: 'scanner', icon: <Scan size={19} />, label: 'Gate Scanner' },
    { id: 'register', icon: <UserPlus size={19} />, label: 'Issue Passes' },
    { id: 'attendees', icon: <Users size={19} />, label: 'Guest List', badge: attendees.length },
    { id: 'tickets', icon: <Ticket size={19} />, label: 'E-Pass Gallery' },
    { id: 'logs', icon: <FileText size={19} />, label: 'Audit Logs' },
  ];

  const NAV_ITEMS = adminRole === 'bouncer' 
    ? ALL_NAV_ITEMS.filter(item => item.id === 'scanner')
    : ALL_NAV_ITEMS;

  const currentTabItem = ALL_NAV_ITEMS.find(i => i.id === tab);

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--paper-bg)', position: 'relative' }}>
      
      {/* ─── Mobile Top Header Bar ─── */}
      <header className="admin-mobile-header" style={{
        position: 'sticky', top: 0, zIndex: 90,
        background: 'white', borderBottom: '3px solid var(--black-ink)',
        padding: '12px 16px', display: 'none', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 0 rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => { sound.playClick(); setIsMobileMenuOpen(!isMobileMenuOpen); }}
            className="btn-secondary"
            style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div>
            <h2 className="marker-font" style={{ fontSize: 18, color: 'var(--purple-main)', margin: 0, lineHeight: 1 }}>VASTEGUNA</h2>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#4B5563', fontFamily: 'var(--font-mono)' }}>
              {currentTabItem?.label || 'Admin'}
            </span>
          </div>
        </div>

        <button 
          onClick={() => { sound.playClick(); onLogout(); }} 
          className="btn-secondary" 
          style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444' }}
        >
          <LogOut size={14} /> Exit
        </button>
      </header>

      {/* ─── Mobile Drawer Backdrop Overlay ─── */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="admin-backdrop"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
            zIndex: 100, display: 'none'
          }}
        />
      )}

      {/* ─── Sidebar (Desktop & Mobile Drawer) ─── */}
      <aside 
        className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
        style={{
          width: isCollapsed ? 76 : 250,
          background: 'white',
          borderRight: '3px solid var(--black-ink)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 110,
          transition: 'width 0.2s ease, transform 0.25s ease',
          flexShrink: 0
        }}
      >
        {/* Sidebar Header */}
        <div style={{
          padding: isCollapsed ? '20px 10px' : '24px 20px',
          background: 'var(--yellow-marker)',
          borderBottom: '3px dashed var(--black-ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          position: 'relative'
        }}>
          {!isCollapsed ? (
            <div>
              <h2 className="marker-font" style={{ fontSize: 22, color: 'var(--purple-main)', lineHeight: 1, transform: 'rotate(-2deg)' }}>VASTEGUNA</h2>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800, color: 'var(--black-ink)', marginTop: 4, letterSpacing: '0.05em' }}>ORGANISER PORTAL</p>
            </div>
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--purple-main)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, border: '2px solid var(--black-ink)' }}>
              VH
            </div>
          )}

          {/* Desktop Collapse Toggle Button */}
          <button 
            onClick={() => { sound.playClick(); setIsCollapsed(!isCollapsed); }}
            className="desktop-collapse-btn"
            style={{
              background: 'white', border: '2px solid var(--black-ink)', borderRadius: 6,
              padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '1px 1px 0 var(--black-ink)',
              position: isCollapsed ? 'absolute' : 'static',
              top: isCollapsed ? 6 : 'auto',
              right: isCollapsed ? 6 : 'auto'
            }}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: isCollapsed ? '16px 8px' : '20px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          {!isCollapsed && (
            <p style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', marginBottom: 4, letterSpacing: '0.1em', paddingLeft: 8 }}>MENU</p>
          )}
          {NAV_ITEMS.map(item => {
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { 
                  sound.playClick(); 
                  setTab(item.id); 
                  setIsMobileMenuOpen(false); 
                }}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: 12,
                  padding: isCollapsed ? '12px' : '10px 14px',
                  borderRadius: 8,
                  background: isActive ? 'var(--purple-main)' : 'transparent',
                  color: isActive ? 'white' : '#4B5563',
                  border: isActive ? '2px solid var(--black-ink)' : '2px solid transparent',
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: isActive ? '2px 2px 0 var(--black-ink)' : 'none',
                  position: 'relative'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                {!isCollapsed && <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                {!isCollapsed && item.badge !== undefined && (
                  <span style={{ 
                    fontSize: 11, fontWeight: 800, padding: '1px 6px', borderRadius: 100, 
                    background: isActive ? 'white' : '#E5E7EB', 
                    color: isActive ? 'var(--purple-main)' : '#4B5563' 
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: isCollapsed ? '14px 8px' : '16px 14px', borderTop: '3px dashed var(--black-ink)' }}>
          <button 
            onClick={() => { sound.playClick(); onLogout(); }} 
            className="btn-secondary" 
            style={{ 
              width: '100%', padding: isCollapsed ? '10px 0' : '10px 12px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              gap: 8, color: '#EF4444', fontSize: 13 
            }}
            title={isCollapsed ? "Exit Portal" : undefined}
          >
            <LogOut size={16} /> {!isCollapsed && 'Exit'}
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', position: 'relative', width: '100%' }}>
        {/* Desktop Quick Header strip with Full-screen / Sidebar Toggle */}
        <div className="desktop-top-strip" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px', borderBottom: '2px dashed rgba(17,24,39,0.1)',
          background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => { sound.playClick(); setIsCollapsed(!isCollapsed); }}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              title={isCollapsed ? "Expand Sidebar Menu" : "Collapse Sidebar for Full Screen"}
            >
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              <span>{isCollapsed ? 'Show Menu' : 'Full Screen View'}</span>
            </button>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--purple-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📍 {currentTabItem?.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
              Logged in as: <strong style={{ color: 'var(--black-ink)' }}>{adminRole === 'bouncer' ? 'Gate Bouncer' : 'Organiser'}</strong>
            </span>
          </div>
        </div>

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
