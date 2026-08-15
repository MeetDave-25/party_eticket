import React, { useState, useEffect } from 'react';
import { storage, PASS_TIERS } from '../services/storage';
import { sound } from '../services/audio';
import {
  Users, CheckCircle2, XCircle, Scan, Search,
  Download, Activity, Loader
} from 'lucide-react';

export default function AttendeeList({ onTestCode }) {
  const [attendees, setAttendees] = useState([]);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const list = await storage.getAttendees();
    setAttendees(list);
    setLoading(false);
  };

  const approvePass = async (att) => {
    sound.playSuccess();
    await storage.updateAttendee(att.id, { status: 'APPROVED' });
  };

  useEffect(() => {
    load();
    window.addEventListener('passguard_data_change', load);
    return () => window.removeEventListener('passguard_data_change', load);
  }, []);

  const tierColors = { VIP: '#F59E0B', SPEAKER: '#8B5CF6', ORGANIZER: '#EC4899', PRESS: '#10B981', GENERAL: '#3B82F6', STUDENT: '#6366F1' };

  const filtered = attendees.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.code?.toLowerCase().includes(q) || a.phone?.includes(q);
    const matchTier   = filterTier   === 'ALL' || a.tier === filterTier;
    const matchStatus = filterStatus === 'ALL' || (filterStatus === 'IN' ? a.checkedIn : !a.checkedIn);
    return matchQ && matchTier && matchStatus;
  });

  const exportCSV = () => {
    sound.playClick();
    const rows = [['Name','Email','Phone','Tier','Code','Seat','Status','CheckedInAt']];
    attendees.forEach(a => rows.push([a.name, a.email||'', a.phone||'', a.tier, a.code, a.seat||'', a.checkedIn ? 'CHECKED_IN' : 'PENDING', a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : '']));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'Vasteguna_GuestList.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '36px 40px', fontFamily: 'var(--font-body)', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--purple-light)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>ATTENDEE MANAGEMENT</p>
          <h1 className="marker-font" style={{ fontSize: 40, color: 'var(--black-ink)', lineHeight: 1 }}>
            Guest List
            <span style={{ fontSize: 20, fontFamily: 'var(--font-body)', background: 'var(--yellow-marker)', border: '2px solid var(--black-ink)', borderRadius: 100, padding: '4px 12px', marginLeft: 16, verticalAlign: 'middle', color: 'var(--black-ink)', fontWeight: 800 }}>
              {loading ? '…' : attendees.length}
            </span>
          </h1>
        </div>
        <button onClick={exportCSV} className="btn-secondary" style={{ padding: '12px 24px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="paper-card" style={{ padding: '24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 250, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input className="pg-input" style={{ paddingLeft: 46 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or code…" />
          </div>
          <select className="pg-select" style={{ width: 180 }} value={filterTier} onChange={e => setFilterTier(e.target.value)}>
            <option value="ALL">All Passes</option>
            {Object.entries(PASS_TIERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="pg-select" style={{ width: 180 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="IN">Checked In</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      <div className="paper-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="pg-table">
          <thead>
            <tr>
              <th>Attendee</th>
              <th>Contact</th>
              <th>Pass Type</th>
              <th>Ticket Code</th>
              <th>Pass Status</th>
              <th>Entry Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}><Loader size={32} className="animate-spin" style={{ margin: '0 auto 16px' }} />Loading from database…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
                <Users size={36} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
                No attendees match your filters
              </td></tr>
            ) : filtered.map(att => {
              const col = tierColors[att.tier] || '#3B82F6';
              return (
                <tr key={att.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${col}15`, border: `2px solid ${col}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: col, flexShrink: 0 }}>
                        {att.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--black-ink)', marginBottom: 2 }}>{att.name}</p>
                        {att.company && <p style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{att.company}</p>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <p style={{ fontSize: 13, color: '#4B5563', fontWeight: 500, marginBottom: 2 }}>{att.email || '—'}</p>
                    <p style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-mono)' }}>{att.phone || ''}</p>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 100, background: `${col}15`, color: col, border: `2px solid ${col}` }}>
                      {PASS_TIERS[att.tier]?.label || att.tier}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#4B5563', fontWeight: 700, background: '#F3F4F6', padding: '4px 8px', borderRadius: 6 }}>{att.code}</span>
                  </td>
                  <td>
                    {att.status === 'PENDING' ? (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 100, background: '#FEF3C7', color: '#D97706', border: '2px solid #D97706' }}>PENDING</span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 100, background: '#D1FAE5', color: '#059669', border: '2px solid #059669' }}>APPROVED</span>
                    )}
                  </td>
                  <td>
                    {att.checkedIn ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={18} color="#10B981" />
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#10B981' }}>VERIFIED</span>
                          {att.checkedInAt && <p style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{new Date(att.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <XCircle size={18} color="#9CA3AF" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF' }}>NOT IN</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {att.status === 'PENDING' && (
                        <button onClick={() => approvePass(att)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--purple-main)', border: '2px solid var(--purple-main)', borderRadius: 8, cursor: 'pointer', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)' }}
                        >
                          <CheckCircle2 size={14} /> Approve
                        </button>
                      )}
                      <button onClick={() => { sound.playClick(); onTestCode(att.code); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', border: '2px solid var(--purple-main)', borderRadius: 8, cursor: 'pointer', color: 'var(--purple-main)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--purple-main)'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--purple-main)'; }}
                      >
                        <Scan size={14} /> Scan
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 16, textAlign: 'right', fontWeight: 600 }}>Showing {filtered.length} of {attendees.length} attendees</p>
    </div>
  );
}
