import React, { useState } from 'react';
import { storage, PASS_TIERS } from '../services/storage';
import { sound } from '../services/audio';
import * as XLSX from 'xlsx';
import { UserPlus, CheckCircle2, AlertCircle, Upload, FileSpreadsheet, Loader, Download } from 'lucide-react';

export default function Registration({ eventInfo, onCreatedAttendee }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', tier: 'GENERAL', seat: '' });
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkSaving, setBulkSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Full name is required.'); sound.playWarning(); return; }
    setSaving(true);
    try {
      const att = await storage.addAttendee(form);
      sound.playSuccess();
      setSubmitted(att);
      setForm({ name: '', email: '', phone: '', company: '', tier: 'GENERAL', seat: '' });
    } catch (err) {
      setError(`Failed to save: ${err.message}`);
      sound.playWarning();
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setBulkSaving(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Assume row 1 is header, data starts from row 2
      const rows = jsonData.slice(1);
      const results = { added: 0, skipped: 0, names: [] };

      for (const row of rows) {
        if (!row || row.length === 0) continue;
        const [name, email, phone, tierStr, company, seat] = row;
        
        if (name) {
          try {
            const tierMatch = Object.keys(PASS_TIERS).find(k => k.toLowerCase() === (tierStr || '').toLowerCase()) || 'GENERAL';
            const att = await storage.addAttendee({ 
              name: String(name).trim(), 
              email: email ? String(email).trim() : '', 
              phone: phone ? String(phone).trim() : '', 
              tier: tierMatch, 
              company: company ? String(company).trim() : '', 
              seat: seat ? String(seat).trim() : '' 
            });
            results.added++;
            results.names.push(att.name);
          } catch (err) {
            console.error('Row failed:', err);
            results.skipped++;
          }
        } else {
          results.skipped++;
        }
      }

      sound.playSuccess();
      setBulkResult(results);
    } catch (err) {
      console.error(err);
      sound.playError();
      alert('Error parsing Excel/CSV file. Ensure it has Name, Email, Phone, Tier columns.');
    } finally {
      setBulkSaving(false);
      e.target.value = ''; // reset file input
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Name', 'Email', 'Phone', 'Tier', 'Company', 'Seat'],
      ['Dhawan Satani', 'dhawan@example.com', '9714509181', 'VIP', 'Vasteguna', 'Row 1'],
      ['Jadav Dashrath', 'jadav@example.com', '9624487630', 'ORGANIZER', 'Vasteguna', 'Backstage']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Vasteguna_Bulk_Import_Template.xlsx');
  };

  return (
    <div style={{ padding: '36px 40px', fontFamily: 'var(--font-body)', maxWidth: 800 }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--purple-light)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Issue Passes</p>
        <h1 className="marker-font" style={{ fontSize: 40, color: 'var(--black-ink)', lineHeight: 1 }}>Register Attendees</h1>
        <p style={{ fontSize: 15, color: '#4B5563', marginTop: 8 }}>Register people individually or use the Excel Bulk Upload for the freshers list.</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
        {[{ id: false, label: 'Single Pass' }, { id: true, label: 'Excel / CSV Bulk Upload' }].map(m => (
          <button key={String(m.id)} onClick={() => { setBulkMode(m.id); setBulkResult(null); sound.playClick(); }}
            className={bulkMode === m.id ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '12px 24px', fontSize: 14 }}>
            {m.label}
          </button>
        ))}
      </div>

      {!bulkMode && (
        <div>
          {submitted ? (
            <div className="paper-card" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: 24, background: '#ECFDF5' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white' }}>
                <CheckCircle2 size={30} />
              </div>
              <div style={{ flex: 1 }}>
                <p className="marker-font" style={{ fontSize: 24, color: '#065F46', marginBottom: 4 }}>E-Pass Generated!</p>
                <p style={{ fontSize: 16, color: '#047857', marginBottom: 4 }}><strong>{submitted.name}</strong> has been added to the guest list.</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#064E3B' }}>Ticket Code: {submitted.code}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => setSubmitted(null)} className="btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}>
                  Add Another
                </button>
                <button onClick={() => onCreatedAttendee()} className="btn-secondary" style={{ padding: '10px 20px', fontSize: 13 }}>
                  View List
                </button>
              </div>
            </div>
          ) : (
            <div className="paper-card" style={{ padding: 40 }}>
              <div className="tape top-center" style={{ width: 80, transform: 'rotate(-2deg)' }} />
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FEE2E2', border: '2px dashed #EF4444', borderRadius: 8, padding: '12px 16px', marginBottom: 24, color: '#B91C1C' }}>
                  <AlertCircle size={18} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{error}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--purple-main)', marginBottom: 8, textTransform: 'uppercase' }}>Full Name *</label>
                    <input className="pg-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="E.g. Rahul Sharma" autoFocus />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--purple-main)', marginBottom: 8, textTransform: 'uppercase' }}>Email</label>
                    <input className="pg-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="rahul@example.com" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--purple-main)', marginBottom: 8, textTransform: 'uppercase' }}>Phone</label>
                    <input className="pg-input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--purple-main)', marginBottom: 8, textTransform: 'uppercase' }}>Pass Type</label>
                    <div style={{ background: '#FAF5FF', border: '2px solid var(--black-ink)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--black-ink)' }}>🎟️ Party Pass</span>
                      <span style={{ background: 'var(--yellow-marker)', border: '1px solid var(--black-ink)', padding: '2px 8px', borderRadius: 4, fontWeight: 800, fontSize: 12 }}>₹350</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ background: '#EFF6FF', border: '2px dashed #3B82F6', borderRadius: 8, padding: 16, display: 'flex', gap: 20, alignItems: 'center' }}>
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=cyash4867@oksbi&pn=Yash%20Chaudhari&am=350&cu=INR" alt="UPI QR Code" style={{ borderRadius: 8, width: 100, height: 100 }} />
                  <div>
                    <p style={{ fontWeight: 800, color: '#1D4ED8', fontSize: 16, marginBottom: 4 }}>Pass Price: ₹350/-</p>
                    <p style={{ fontSize: 14, color: '#1E3A8A', marginBottom: 8, fontWeight: 500 }}>Scan with GPay or any UPI app to pay.</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, background: 'white', padding: '6px 10px', border: '1px solid #BFDBFE', borderRadius: 6, display: 'inline-block', margin: 0 }}>UPI ID: cyash4867@oksbi</p>
                  </div>
                </div>

                <button type="submit" disabled={saving} className="btn-success" style={{ padding: '16px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
                  {saving ? <><Loader size={20} className="animate-spin" /> Saving...</> : <><UserPlus size={20} /> Generate E-Pass</>}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {bulkMode && (
        <div>
          <div className="paper-card" style={{ padding: 40, textAlign: 'center', background: 'rgba(251,191,36,0.1)' }}>
            <div className="tape top-center" style={{ width: 80, transform: 'rotate(2deg)' }} />
            
            <h3 className="marker-font" style={{ fontSize: 28, color: 'var(--purple-main)', marginBottom: 12 }}>Excel & CSV Import</h3>
            <p style={{ fontSize: 15, color: '#4B5563', marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
              Upload an Excel (.xlsx, .xls) or CSV file with your guest list. The first row should be headers (Name, Email, Phone, Tier, Company, Seat).
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32 }}>
              <button onClick={downloadTemplate} className="btn-secondary" style={{ padding: '10px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Download size={16} /> Download Template
              </button>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: 200, background: 'white', border: '3px dashed var(--purple-main)', borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s' }}>
              {bulkSaving ? (
                <>
                  <Loader size={48} color="var(--purple-main)" className="animate-spin" />
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--purple-main)' }}>Processing File...</p>
                </>
              ) : (
                <>
                  <FileSpreadsheet size={48} color="var(--purple-main)" />
                  <div>
                    <p className="btn-primary" style={{ display: 'inline-block', padding: '10px 24px', fontSize: 14 }}>Select Excel / CSV File</p>
                  </div>
                </>
              )}
              <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileUpload} style={{ display: 'none' }} disabled={bulkSaving} />
            </label>
          </div>

          {bulkResult && (
            <div className="paper-card" style={{ marginTop: 32, background: '#ECFDF5', padding: '24px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <CheckCircle2 size={28} color="#10B981" />
                <span className="marker-font" style={{ fontSize: 24, color: '#065F46' }}>
                  Import Complete! 
                </span>
              </div>
              <p style={{ fontSize: 16, color: '#047857', fontWeight: 600, marginBottom: 16 }}>
                {bulkResult.added} passes generated successfully. {bulkResult.skipped} rows skipped.
              </p>
              
              {bulkResult.names.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 150, overflowY: 'auto', padding: 12, background: 'white', border: '2px solid #D1FAE5', borderRadius: 8 }}>
                  {bulkResult.names.map((n, i) => (
                    <span key={i} style={{ fontSize: 13, padding: '4px 10px', background: '#D1FAE5', color: '#065F46', borderRadius: 6, fontWeight: 600 }}>{n}</span>
                  ))}
                </div>
              )}
              
              <button onClick={() => { setBulkResult(null); onCreatedAttendee(); }} className="btn-primary" style={{ marginTop: 24, padding: '12px 24px', fontSize: 14 }}>
                View Guest List
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
