import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { sound } from '../services/audio';
import {
  CheckCircle2, AlertTriangle, XCircle, Trash2,
  Download, Activity, Loader
} from 'lucide-react';

export default function ScanLogs() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const list = await storage.getScanLogs();
    setLogs(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    window.addEventListener('passguard_data_change', load);
    return () => window.removeEventListener('passguard_data_change', load);
  }, []);

  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.status === filter);
  const stats = {
    total:     logs.length,
    success:   logs.filter(l => l.status === 'SUCCESS').length,
    duplicate: logs.filter(l => l.status === 'DUPLICATE').length,
    invalid:   logs.filter(l => l.status === 'INVALID').length,
  };

  const STATUS = {
    SUCCESS:   { color: '#10B981', icon: <CheckCircle2 size={16} color="#10B981" />, bg: '#ECFDF5', border: '#10B981' },
    DUPLICATE: { color: '#F59E0B', icon: <AlertTriangle size={16} color="#F59E0B" />, bg: '#FEF3C7', border: '#F59E0B' },
    INVALID:   { color: '#EF4444', icon: <XCircle size={16} color="#EF4444" />, bg: '#FEE2E2', border: '#EF4444' },
  };

  const exportLogs = () => {
    sound.playClick();
    const rows = [['Timestamp','Ticket Code','Attendee','Status','Gate']];
    logs.forEach(l => rows.push([new Date(l.timestamp).toLocaleString(), l.ticketCode, l.attendeeName || 'Unknown', l.status, l.gateLocation || 'Gate']));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'Vasteguna_ScanLogs.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = async () => {
    if (!window.confirm('Clear all scan logs from the database? This cannot be undone.')) return;
    sound.playClick();
    await storage.clearScanLogs();
    setLogs([]);
  };

  return (
    <div style={{ padding: '36px 40px', fontFamily: 'var(--font-body)', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--purple-light)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>AUDIT TRAIL</p>
          <h1 className="marker-font" style={{ fontSize: 40, color: 'var(--black-ink)', lineHeight: 1 }}>Gate Scan Logs</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={exportLogs} className="btn-secondary" style={{ padding: '12px 20px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={18} /> Export
          </button>
          <button onClick={clearLogs} className="btn-secondary" style={{ padding: '12px 20px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444' }}>
            <Trash2 size={18} /> Clear DB
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        {[
          { label: 'Total Scans', value: stats.total,     color: 'var(--purple-main)', bg: '#F3E8FF', border: 'var(--purple-main)' },
          { label: 'Successful',  value: stats.success,   color: '#10B981', bg: '#ECFDF5', border: '#10B981' },
          { label: 'Duplicates',  value: stats.duplicate, color: '#F59E0B', bg: '#FEF3C7', border: '#F59E0B' },
          { label: 'Invalid',     value: stats.invalid,   color: '#EF4444', bg: '#FEE2E2', border: '#EF4444' },
        ].map((s, i) => (
          <div key={i} className="paper-card" style={{ background: s.bg, border: `2px solid ${s.border}`, padding: '24px' }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#6B7280', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>{s.label}</p>
            <p className="marker-font" style={{ fontSize: 40, fontWeight: 700, color: s.color, lineHeight: 1 }}>{loading ? '…' : s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {['ALL','SUCCESS','DUPLICATE','INVALID'].map(f => {
          const isActive = filter === f;
          return (
            <button key={f} onClick={() => { sound.playClick(); setFilter(f); }}
              className={isActive ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '10px 20px', borderRadius: 100, fontSize: 13 }}>
              {f} {f !== 'ALL' && `(${stats[f.toLowerCase()]})`}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
          <Loader size={32} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--purple-main)' }} className="animate-spin" />
          <p style={{ fontWeight: 600 }}>Loading scan logs from database…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
          <Activity size={40} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>No scan records {filter !== 'ALL' ? `with status "${filter}"` : 'yet'}.</p>
        </div>
      ) : (
        <div className="paper-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="pg-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Attendee</th>
                <th>Ticket Code</th>
                <th>Status</th>
                <th>Gate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const s = STATUS[log.status] || STATUS.INVALID;
                return (
                  <tr key={log.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: '#4B5563', fontWeight: 600 }}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{new Date(log.timestamp).toLocaleDateString()}</p>
                    </td>
                    <td style={{ fontSize: 14, fontWeight: 700, color: log.attendeeName ? 'var(--black-ink)' : '#9CA3AF' }}>{log.attendeeName || 'Unknown / Unregistered'}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#4B5563', fontWeight: 700, background: '#F3F4F6', padding: '4px 8px', borderRadius: 6 }}>{log.ticketCode}</span>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 100, background: s.bg, border: `2px solid ${s.border}` }}>
                        {s.icon}
                        <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{log.status}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 14, color: '#6B7280', fontWeight: 600 }}>{log.gateLocation || 'Gate Alpha'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
