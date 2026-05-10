'use client';
import { useState, useEffect } from 'react';

const REJECT_REASONS = [
  'Cap Alignment / Loose Cap',
  'Label Centering / Wrinkle',
  'Underfill / Overfill',
  'Damaged Packaging',
  'Code / Expiry Misprint',
  'Bulk Separation / Quality Issue',
  'Contamination',
  'Color / Odor Deviation',
  'Leaking / Seal Failure',
  'Other'
];

export default function Quality() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [year] = useState(new Date().getFullYear());
  const [month] = useState(new Date().getMonth() + 1);
  const [rejectForm, setRejectForm] = useState({ reason: REJECT_REASONS[0], rejectQty: 0, notes: '' });
  const [saving, setSaving] = useState(false);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/quality?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => { setData(d.data || d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year, month]);

  const handleLogReject = async () => {
    if (rejectForm.rejectQty <= 0) return;
    setSaving(true);
    await fetch('/api/quality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rejectQty: rejectForm.rejectQty,
        reason: rejectForm.reason,
        workOrderId: null
      })
    });
    // Refresh data
    const res = await fetch(`/api/quality?year=${year}&month=${month}`).then(r => r.json());
    setData(res.data || res);
    setRejectForm({ reason: REJECT_REASONS[0], rejectQty: 0, notes: '' });
    setSaving(false);
  };

  const summary = data?.summary || {};
  const reworkEntries = data?.reworkEntries || [];
  const qualityEvents = data?.qualityEvents || [];

  const qColor = (summary.qualityRate || 100) >= 99 ? 'var(--color-success)' : (summary.qualityRate || 100) >= 95 ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <div>
      <div className="card-header">
        <div>
          <h1 className="card-title" style={{fontSize:'2rem'}}>Quality Control & Compliance</h1>
          <p style={{color:'var(--text-muted)', fontSize:'0.9rem', marginTop:'0.25rem'}}>
            {MONTHS[month-1]} {year} — Live from database
          </p>
        </div>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span className="role-tag role-quality">Quality</span>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-4">
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-success)'}}>
          <div className="stat-title">Quality Rate</div>
          <div className="stat-value" style={{color: qColor}}>{summary.qualityRate || 100}%</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>From {summary.oeeRecordCount || 0} OEE records</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-danger)'}}>
          <div className="stat-title">Total Rejects</div>
          <div className="stat-value" style={{color:'var(--color-danger)'}}>{(summary.totalRejects || 0).toLocaleString()}</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>pieces this month</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-warning)'}}>
          <div className="stat-title">Rework Total</div>
          <div className="stat-value" style={{color:'var(--color-warning)'}}>{(summary.reworkTotal || 0).toLocaleString()}</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>from daily entries</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-primary)'}}>
          <div className="stat-title">Good Output</div>
          <div className="stat-value" style={{color:'var(--color-primary)'}}>{(summary.totalOutput || 0).toLocaleString()}</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>pieces produced</div>
        </div>
      </div>

      <div className="grid-cols-2" style={{marginTop:'1.5rem'}}>
        {/* Reject Entry Form */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Log Production Rejects</h2><span className="source-tag source-manual">MANUAL ENTRY</span></div>
          <div className="form-section">
            <div className="form-row">
              <div className="input-group">
                <label className="input-label">REJECT REASON</label>
                <select className="input-field" value={rejectForm.reason} onChange={e => setRejectForm({...rejectForm, reason: e.target.value})}>
                  {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">QUANTITY (PCS)</label>
                <input className="input-field" type="number" placeholder="0" value={rejectForm.rejectQty || ''} 
                  onChange={e => setRejectForm({...rejectForm, rejectQty: Number(e.target.value)})} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">CORRECTIVE ACTION TAKEN</label>
              <textarea className="input-field" rows={2} placeholder="What was done to fix the issue?" 
                value={rejectForm.notes} onChange={e => setRejectForm({...rejectForm, notes: e.target.value})} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => setRejectForm({reason: REJECT_REASONS[0], rejectQty: 0, notes:''})}>Clear</button>
            <button className="btn btn-primary" onClick={handleLogReject} disabled={saving || rejectForm.rejectQty <= 0}>
              {saving ? 'Saving...' : 'Log Reject'}
            </button>
          </div>
        </div>

        {/* Rework Entries from Daily Production */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Rework from Shift Entries</h2></div>
          <div className="table-container">
            <table>
              <thead><tr><th>Date</th><th>SKU</th><th>Shift</th><th>Rework</th><th>Output</th><th>Rate</th></tr></thead>
              <tbody>
                {reworkEntries.length === 0 ? (
                  <tr><td colSpan={6} style={{textAlign:'center', padding:'2rem', color:'var(--text-muted)'}}>No rework entries this month</td></tr>
                ) : reworkEntries.map((e: any, i: number) => {
                  const rate = e.actualQty > 0 ? ((e.actualQty - e.reworkQty) / e.actualQty * 100) : 100;
                  return (
                    <tr key={i}>
                      <td style={{fontSize:'0.8rem'}}>{new Date(e.date).toLocaleDateString()}</td>
                      <td style={{fontFamily:'monospace', fontSize:'0.8rem'}}>{e.sku}</td>
                      <td>S{e.shift}</td>
                      <td style={{color:'var(--color-danger)', fontWeight:600}}>{e.reworkQty}</td>
                      <td>{e.actualQty.toLocaleString()}</td>
                      <td style={{fontWeight:600, color: rate >= 99 ? 'var(--color-success)' : 'var(--color-warning)'}}>{rate.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quality Events History */}
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Quality Events Log</h2></div>
        <div className="table-container">
          <table>
            <thead><tr><th>Time</th><th>Reason</th><th>Qty</th><th>Source</th></tr></thead>
            <tbody>
              {qualityEvents.length === 0 ? (
                <tr><td colSpan={4} style={{textAlign:'center', padding:'2rem', color:'var(--text-muted)'}}>No quality events logged yet. Use the form above to log rejects.</td></tr>
              ) : qualityEvents.map((e: any, i: number) => (
                <tr key={i}>
                  <td style={{fontSize:'0.8rem'}}>{new Date(e.createdAt).toLocaleString()}</td>
                  <td>{e.reason}</td>
                  <td style={{fontWeight:600, color:'var(--color-danger)'}}>{e.rejectQty}</td>
                  <td><span className="source-tag source-manual">{e.sourceTag}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
