import React, { useState, useEffect } from 'react';
import { storage, PASS_TIERS } from '../services/storage';
import { sound } from '../services/audio';
import {
  Users, CheckCircle2, XCircle, Scan, Search,
  Download, Activity, Loader, Trash2, Check, X, Clock, AlertTriangle
} from 'lucide-react';

export default function AttendeeList({ onTestCode }) {
  const [attendees, setAttendees] = useState([]);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'CHECKED_IN'
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const load = async () => {
    const list = await storage.getAttendees();
    setAttendees(list);
    setLoading(false);
  };

  const approvePass = async (att) => {
    setActionLoadingId(att.id);
    try {
      await storage.updateAttendee(att.id, { status: 'APPROVED' });
      sound.playSuccess();
    } catch (err) {
      alert(`Failed to approve: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const rejectPass = async (att) => {
    if (!window.confirm(`Are you sure you want to reject and delete the pass request for "${att.name}"?`)) return;
    setActionLoadingId(att.id);
    try {
      await storage.deleteAttendee(att.id);
      sound.playClick();
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    load();
    window.addEventListener('passguard_data_change', load);
    return () => window.removeEventListener('passguard_data_change', load);
  }, []);

  const pendingCount = attendees.filter(a => a.status === 'PENDING').length;
  const approvedCount = attendees.filter(a => a.status === 'APPROVED').length;
  const checkedInCount = attendees.filter(a => a.checkedIn).length;

  const filtered = attendees.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || 
      a.name?.toLowerCase().includes(q) || 
      a.email?.toLowerCase().includes(q) || 
      a.code?.toLowerCase().includes(q) || 
      a.phone?.includes(q);

    let matchTab = true;
    if (filterTab === 'PENDING') matchTab = a.status === 'PENDING';
    if (filterTab === 'APPROVED') matchTab = a.status === 'APPROVED';
    if (filterTab === 'CHECKED_IN') matchTab = a.checkedIn;

    return matchQ && matchTab;
  });

  const exportCSV = () => {
    sound.playClick();
    const rows = [['Name','Email','Phone','Tier','Code','Seat','ApprovalStatus','CheckedIn','CheckedInAt']];
    attendees.forEach(a => rows.push([
      a.name, 
      a.email||'', 
      a.phone||'', 
      a.tier||'GENERAL', 
      a.code, 
      a.seat||'', 
      a.status||'APPROVED',
      a.checkedIn ? 'YES' : 'NO', 
      a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : ''
    ]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'Vasteguna_GuestList.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '36px 40px', fontFamily: 'var(--font-body)', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--purple-light)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>ATTENDEE MANAGEMENT</p>
          <h1 className="marker-font" style={{ fontSize: 40, color: 'var(--black-ink)', lineHeight: 1 }}>
            Guest List
            <span style={{ fontSize: 18, fontFamily: 'var(--font-mono)', background: 'var(--yellow-marker)', border: '2px solid var(--black-ink)', borderRadius: 100, padding: '4px 14px', marginLeft: 16, verticalAlign: 'middle', color: 'var(--black-ink)', fontWeight: 800 }}>
              {loading ? '…' : attendees.length}
            </span>
          </h1>
        </div>
        <button onClick={exportCSV} className="btn-secondary" style={{ padding: '10px 20px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Download size={17} /> Export CSV
        </button>
      </div>

      {/* ─── Pending Approval Alert Banner (If Any) ─── */}
      {pendingCount > 0 && filterTab !== 'PENDING' && (
        <div style={{
          background: '#FEF3C7', border: '2px solid #D97706', borderRadius: 12, padding: '16px 20px',
          marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          boxShadow: '3px 3px 0 rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#D97706', color: 'white', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <div>
              <p style={{ fontWeight: 800, color: '#92400E', fontSize: 15, margin: 0 }}>
                {pendingCount} Pass Request{pendingCount > 1 ? 's' : ''} Waiting for Approval!
              </p>
              <p style={{ fontSize: 13, color: '#B45309', margin: '2px 0 0' }}>
                Attendees who submitted payment & registration are waiting for you to accept their ticket.
              </p>
            </div>
          </div>
          <button 
            onClick={() => { sound.playClick(); setFilterTab('PENDING'); }}
            style={{
              background: '#D97706', color: 'white', border: '2px solid #78350F', borderRadius: 8,
              padding: '8px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer'
            }}
          >
            Review Pending ({pendingCount})
          </button>
        </div>
      )}

      {/* ─── Filter Tabs & Search Bar ─── */}
      <div className="paper-card" style={{ padding: '20px', marginBottom: 24 }}>
        
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { id: 'ALL', label: 'All Passes', count: attendees.length, col: 'var(--purple-main)' },
            { id: 'PENDING', label: '⚡ Pending Approval', count: pendingCount, col: '#D97706', highlight: pendingCount > 0 },
            { id: 'APPROVED', label: '✓ Approved', count: approvedCount, col: '#059669' },
            { id: 'CHECKED_IN', label: '🎟️ Checked In', count: checkedInCount, col: '#2563EB' }
          ].map(tab => {
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { sound.playClick(); setFilterTab(tab.id); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '2px solid var(--black-ink)',
                  background: isActive ? tab.col : tab.highlight ? '#FEF3C7' : 'white',
                  color: isActive ? 'white' : 'var(--black-ink)',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: isActive ? '2px 2px 0 var(--black-ink)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 100,
                  background: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.08)',
                  color: isActive ? 'white' : 'inherit'
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input 
            className="pg-input" 
            style={{ paddingLeft: 46, width: '100%' }} 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search by name, email, phone number, or ticket code…" 
          />
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="paper-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="pg-table" style={{ minWidth: 800 }}>
            <thead>
              <tr>
                <th>Attendee</th>
                <th>Contact</th>
                <th>Pass Type</th>
                <th>Ticket Code</th>
                <th>Approval Status</th>
                <th>Gate Entry</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}><Loader size={32} className="animate-spin" style={{ margin: '0 auto 16px' }} />Loading from database…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
                  <Users size={36} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
                  <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--black-ink)', marginBottom: 4 }}>No passes found</p>
                  <p style={{ fontSize: 13 }}>{search ? `No results for "${search}"` : `No tickets in the "${filterTab}" list.`}</p>
                </td></tr>
              ) : filtered.map(att => {
                const isPending = att.status === 'PENDING';
                const isBusy = actionLoadingId === att.id;
                
                return (
                  <tr key={att.id} style={{ background: isPending ? '#FFFBEB' : 'transparent' }}>
                    {/* Name */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ 
                          width: 42, height: 42, borderRadius: 10, 
                          background: isPending ? '#FEF3C7' : '#F3E8FF', 
                          border: `2px solid ${isPending ? '#D97706' : 'var(--purple-main)'}`, 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          fontSize: 16, fontWeight: 800, 
                          color: isPending ? '#D97706' : 'var(--purple-main)', 
                          flexShrink: 0 
                        }}>
                          {att.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--black-ink)', marginBottom: 2 }}>{att.name}</p>
                          {att.company && <p style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{att.company}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td>
                      <p style={{ fontSize: 13, color: '#4B5563', fontWeight: 500, marginBottom: 2 }}>{att.email || '—'}</p>
                      <p style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{att.phone || '—'}</p>
                    </td>

                    {/* Pass Type */}
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 100, background: '#FAF5FF', color: 'var(--purple-main)', border: '1.5px solid var(--purple-main)' }}>
                        {PASS_TIERS[att.tier]?.label || 'Party Pass'}
                      </span>
                    </td>

                    {/* Code */}
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: '#1F2937', fontWeight: 800, background: '#F3F4F6', border: '1px solid #E5E7EB', padding: '4px 8px', borderRadius: 6 }}>
                        {att.code}
                      </span>
                    </td>

                    {/* Approval Status */}
                    <td>
                      {isPending ? (
                        <span style={{ 
                          fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 100, 
                          background: '#FEF3C7', color: '#B45309', border: '2px solid #D97706',
                          display: 'inline-flex', alignItems: 'center', gap: 5 
                        }}>
                          <Clock size={12} /> PENDING APPROVAL
                        </span>
                      ) : (
                        <span style={{ 
                          fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 100, 
                          background: '#D1FAE5', color: '#047857', border: '2px solid #059669',
                          display: 'inline-flex', alignItems: 'center', gap: 5 
                        }}>
                          <CheckCircle2 size={12} /> APPROVED
                        </span>
                      )}
                    </td>

                    {/* Gate Check-in Status */}
                    <td>
                      {att.checkedIn ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={16} color="#10B981" />
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#059669' }}>INSIDE</span>
                            {att.checkedInAt && (
                              <p style={{ fontSize: 11, color: '#6B7280', fontFamily: 'var(--font-mono)', margin: 0 }}>
                                {new Date(att.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>Not Scanned</span>
                      )}
                    </td>

                    {/* Actions (Approve / Reject / Test Scan) */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                        
                        {/* If Pending: Show Big Green Approve Button + Reject */}
                        {isPending ? (
                          <>
                            <button 
                              onClick={() => approvePass(att)}
                              disabled={isBusy}
                              style={{ 
                                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', 
                                background: '#10B981', border: '2px solid var(--black-ink)', borderRadius: 8, 
                                cursor: isBusy ? 'wait' : 'pointer', color: 'white', fontSize: 13, fontWeight: 800,
                                boxShadow: '2px 2px 0 var(--black-ink)'
                              }}
                              title="Accept & Approve Ticket"
                            >
                              <Check size={15} /> Approve
                            </button>

                            <button 
                              onClick={() => rejectPass(att)}
                              disabled={isBusy}
                              style={{ 
                                display: 'flex', alignItems: 'center', gap: 4, padding: '8px 10px', 
                                background: '#FEE2E2', border: '2px solid #EF4444', borderRadius: 8, 
                                cursor: isBusy ? 'wait' : 'pointer', color: '#B91C1C', fontSize: 12, fontWeight: 700 
                              }}
                              title="Reject & Delete Ticket"
                            >
                              <Trash2 size={14} /> Reject
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Approved passes: Test Gate Scan button */}
                            <button 
                              onClick={() => { sound.playClick(); onTestCode(att.code); }}
                              style={{ 
                                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', 
                                background: 'white', border: '2px solid var(--black-ink)', borderRadius: 8, 
                                cursor: 'pointer', color: 'var(--purple-main)', fontSize: 12.5, fontWeight: 700,
                                boxShadow: '2px 2px 0 var(--black-ink)', transition: 'all 0.1s' 
                              }}
                              title="Test Scan this Pass"
                            >
                              <Scan size={14} /> Scan
                            </button>

                            <button 
                              onClick={() => rejectPass(att)}
                              style={{ 
                                padding: '7px 8px', background: 'transparent', border: '1px solid #E5E7EB', 
                                borderRadius: 8, cursor: 'pointer', color: '#9CA3AF' 
                              }}
                              title="Delete Pass"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ fontSize: 13, color: '#6B7280', marginTop: 16, textAlign: 'right', fontWeight: 600 }}>
        Showing {filtered.length} of {attendees.length} attendees
      </p>
    </div>
  );
}
