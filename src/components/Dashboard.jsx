import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { sound } from '../services/audio';
import {
  Users, CheckCircle2, Ticket, QrCode,
  TrendingUp, Download, Play, Zap, ShieldAlert,
  Loader
} from 'lucide-react';

export default function Dashboard({ onNavigate, onTestCode }) {
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, pendingApprovals: 0, approved: 0, todayScans: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const list = await storage.getAttendees();
    const logs = await storage.getScanLogs();
    
    const checked = list.filter(a => a.checkedIn).length;
    const pendingApp = list.filter(a => a.status === 'PENDING').length;
    const approved = list.filter(a => a.status === 'APPROVED').length;

    setStats({
      total: list.length,
      checkedIn: checked,
      pendingApprovals: pendingApp,
      approved: approved,
      todayScans: logs.length,
    });
    setRecentLogs(logs.slice(0, 5));
    setLoading(false);
  };

  useEffect(() => {
    load();
    window.addEventListener('passguard_data_change', load);
    return () => window.removeEventListener('passguard_data_change', load);
  }, []);

  const ACTIONS = [
    { id: 'attendees', label: 'Review & Approve Passes', icon: <Users size={20} />, col: '#D97706', desc: 'Accept new ticket requests & guest list' },
    { id: 'scanner', label: 'Open Gate Scanner', icon: <QrCode size={20} />, col: 'var(--purple-main)', desc: 'Live QR ticket verification at the gate' },
    { id: 'register', label: 'Issue Manual Pass', icon: <Ticket size={20} />, col: '#10B981', desc: 'Add attendee or bulk import excel' },
  ];

  return (
    <div style={{ padding: '40px', fontFamily: 'var(--font-body)', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--purple-light)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>OVERVIEW</p>
          <h1 className="marker-font" style={{ fontSize: 40, color: 'var(--black-ink)', lineHeight: 1 }}>Command Center</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#ECFDF5', border: '2px solid #10B981', borderRadius: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }}></span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>SYSTEM ONLINE</span>
          </div>
        </div>
      </div>

      {/* Pending Approval Banner */}
      {stats.pendingApprovals > 0 && (
        <div style={{
          background: '#FEF3C7', border: '2px solid #D97706', borderRadius: 12, padding: '18px 24px',
          marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          boxShadow: '4px 4px 0 rgba(0,0,0,0.06)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#92400E' }}>
              ⚡ {stats.pendingApprovals} New Ticket Request{stats.pendingApprovals > 1 ? 's' : ''} Awaiting Your Approval!
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#B45309' }}>
              Verify their payment and click Approve to generate and deliver their QR pass.
            </p>
          </div>
          <button 
            onClick={() => { sound.playClick(); onNavigate('attendees'); }}
            style={{
              background: '#D97706', color: 'white', border: '2px solid #78350F', borderRadius: 8,
              padding: '10px 20px', fontWeight: 800, fontSize: 14, cursor: 'pointer',
              boxShadow: '2px 2px 0 #78350F'
            }}
          >
            Review & Accept Tickets →
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
        {[
          { label: 'Total Registrations', value: stats.total, icon: <Ticket size={22} />, bg: '#F3E8FF', border: 'var(--purple-main)', color: 'var(--purple-main)' },
          { label: 'Pending Approval', value: stats.pendingApprovals, icon: <Users size={22} />, bg: stats.pendingApprovals > 0 ? '#FEF3C7' : '#F9FAFB', border: stats.pendingApprovals > 0 ? '#D97706' : '#D1D5DB', color: stats.pendingApprovals > 0 ? '#D97706' : '#6B7280' },
          { label: 'Approved Passes', value: stats.approved, icon: <CheckCircle2 size={22} />, bg: '#ECFDF5', border: '#10B981', color: '#10B981' },
          { label: 'Checked In (Gate)', value: stats.checkedIn, icon: <QrCode size={22} />, bg: '#EFF6FF', border: '#3B82F6', color: '#3B82F6' },
        ].map((s, i) => (
          <div key={i} className="paper-card" style={{ padding: '20px', background: s.bg, border: `2px solid ${s.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ padding: '8px', background: 'white', borderRadius: 8, color: s.color, border: `2px solid ${s.border}` }}>{s.icon}</div>
              <div className="tape top-center" style={{ width: 36, right: 10, left: 'auto', transform: 'rotate(5deg)' }} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#4B5563', marginBottom: 2 }}>{s.label}</p>
            {loading ? (
              <Loader size={26} className="animate-spin" color={s.color} />
            ) : (
              <p className="marker-font" style={{ fontSize: 38, fontWeight: 700, color: 'var(--black-ink)', lineHeight: 1, margin: 0 }}>{s.value}</p>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        
        {/* Quick Actions */}
        <div>
          <h3 className="marker-font" style={{ fontSize: 24, color: 'var(--black-ink)', marginBottom: 20 }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {ACTIONS.map(a => (
              <button key={a.id} onClick={() => { sound.playClick(); onNavigate(a.id); }}
                className="paper-card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px', width: '100%', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', borderLeft: `6px solid ${a.col}` }}>
                <div style={{ width: 50, height: 50, borderRadius: 12, background: `${a.col}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.col, flexShrink: 0 }}>
                  {a.icon}
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--black-ink)', marginBottom: 4 }}>{a.label}</p>
                  <p style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>{a.desc}</p>
                </div>
                <div style={{ marginLeft: 'auto', color: '#9CA3AF' }}>
                  <Play size={20} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Scan Feed */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 className="marker-font" style={{ fontSize: 24, color: 'var(--black-ink)' }}>Live Scan Feed</h3>
            <button onClick={() => onNavigate('logs')} style={{ fontSize: 13, color: 'var(--purple-main)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
          </div>
          <div className="paper-card" style={{ padding: '0', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><Loader className="animate-spin" style={{ margin: '0 auto' }} /></div>
            ) : recentLogs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6B7280' }}>
                <Zap size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: 14, fontWeight: 500 }}>No scans recorded yet.<br/>Start scanning passes at the gate!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentLogs.map((log, i) => {
                  const isSuccess = log.status === 'SUCCESS';
                  return (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < recentLogs.length - 1 ? '1px dashed #E5E7EB' : 'none', background: i === 0 ? 'rgba(251,191,36,0.05)' : 'white' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: isSuccess ? '#ECFDF5' : '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSuccess ? '#10B981' : '#EF4444', flexShrink: 0 }}>
                        {isSuccess ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--black-ink)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.attendeeName || 'Unknown Pass'}
                        </p>
                        <p style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-mono)' }}>{log.ticketCode}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: isSuccess ? '#10B981' : '#EF4444', background: isSuccess ? '#D1FAE5' : '#FEE2E2', padding: '2px 8px', borderRadius: 4, marginBottom: 4 }}>{log.status}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
}
