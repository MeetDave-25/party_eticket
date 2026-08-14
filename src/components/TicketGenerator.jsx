import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { sound } from '../services/audio';
import PassCard from './PassCard';
import { Search, Ticket, ChevronLeft, ChevronRight, Loader } from 'lucide-react';

export default function TicketGenerator({ eventInfo, onTestCode }) {
  const [attendees, setAttendees] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const PER_PAGE = 6;

  const load = async () => {
    const list = await storage.getAttendees();
    setAttendees(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    window.addEventListener('passguard_data_change', load);
    return () => window.removeEventListener('passguard_data_change', load);
  }, []);

  const filtered = attendees.filter(a => {
    const q = search.toLowerCase();
    return !q || a.name.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.code?.toLowerCase().includes(q);
  });

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div style={{ padding: '36px 40px', fontFamily: 'var(--font-body)', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--purple-light)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>DIGITAL PASSES</p>
        <h1 className="marker-font" style={{ fontSize: 40, color: 'var(--black-ink)', lineHeight: 1 }}>E-Pass Gallery</h1>
        <p style={{ fontSize: 15, color: '#4B5563', marginTop: 8 }}>Browse, download, or test-scan any issued pass from the database.</p>
      </div>

      <div style={{ position: 'relative', maxWidth: 420, marginBottom: 32 }}>
        <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input className="pg-input" style={{ paddingLeft: 46 }} value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search by name, email, or ticket code…" />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
          <Loader size={36} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--purple-main)' }} className="animate-spin" />
          <p style={{ fontWeight: 600 }}>Loading passes from database…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
          <Ticket size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>No passes found{search ? ` for "${search}"` : ''}.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 40, marginBottom: 40 }}>
            {paginated.map(att => (
              <div key={att.id} style={{ display: 'flex', justifyContent: 'center' }}>
                <PassCard attendee={att} eventInfo={eventInfo}
                  onSimulateScan={(code) => { sound.playClick(); onTestCode(code); }} showActions={true} />
              </div>
            ))}
          </div>
          
          {pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <button onClick={() => { sound.playClick(); setPage(p => Math.max(0, p - 1)); }} disabled={page === 0} className="btn-secondary"
                style={{ padding: '10px 20px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, opacity: page === 0 ? 0.4 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
                <ChevronLeft size={18} /> Prev
              </button>
              <span style={{ fontSize: 14, color: '#4B5563', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{page + 1} / {pages}</span>
              <button onClick={() => { sound.playClick(); setPage(p => Math.min(pages - 1, p + 1)); }} disabled={page >= pages - 1} className="btn-secondary"
                style={{ padding: '10px 20px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, opacity: page >= pages - 1 ? 0.4 : 1, cursor: page >= pages - 1 ? 'not-allowed' : 'pointer' }}>
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
