'use client';
import { useState, useEffect } from 'react';

export default function ProductionSummary() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/mps?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => { setPlans(Array.isArray(d.data) ? d.data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year, month]);

  const totalTarget = plans.reduce((s, p) => s + (p.targetQty || 0), 0);
  const totalActual = plans.reduce((s, p) => s + (p.totalActual || 0), 0);
  const totalBulk   = plans.reduce((s, p) => s + (p.bulkKg || 0), 0);
  const overallSL   = totalTarget > 0 ? (totalActual / totalTarget * 100) : 0;
  const onTarget    = plans.filter(p => (p.sl || 0) >= 95).length;
  const atRisk      = plans.filter(p => (p.sl || 0) > 0 && (p.sl || 0) < 80).length;

  const slColor = (sl: number) =>
    sl >= 95 ? 'var(--color-success)' : sl >= 80 ? 'var(--color-warning)' : sl > 0 ? 'var(--color-danger)' : 'var(--text-muted)';

  const slBg = (sl: number) =>
    sl >= 95 ? 'rgba(16,185,129,0.1)' : sl >= 80 ? 'rgba(245,158,11,0.1)' : sl > 0 ? 'rgba(239,68,68,0.07)' : 'transparent';

  return (
    <div>
      <div className="card-header">
        <div>
          <h1 className="card-title" style={{fontSize:'2rem'}}>Monthly Production Summary</h1>
          <p style={{color:'var(--text-muted)', fontSize:'0.9rem', marginTop:'0.25rem'}}>
            {MONTHS[month-1]} {year} — replaces the "Prod Summary" sheet
          </p>
        </div>
        <div style={{display:'flex', gap:'0.75rem'}}>
          <select className="input-field" style={{width:'auto', padding:'0.5rem'}}
            value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input-field" style={{width:'auto', padding:'0.5rem'}}
            value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <a href="/production" className="btn btn-outline">✏️ Entry View</a>
          <a href={`/api/export/production?year=${year}&month=${month}`} className="btn btn-primary">📤 Export Excel</a>
        </div>
      </div>

      {/* KPI Headline Cards */}
      <div className="grid-cols-4" style={{marginBottom:'1.5rem'}}>
        <div className="card" style={{borderTop:'3px solid var(--color-primary)', textAlign:'center'}}>
          <div style={{fontSize:'0.8rem',color:'var(--text-muted)',fontWeight:600,letterSpacing:'0.05em'}}>T MONTHLY PLAN</div>
          <div style={{fontSize:'2.5rem',fontWeight:800,color:'var(--color-primary)',margin:'0.5rem 0'}}>{totalTarget.toLocaleString()}</div>
          <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>pieces</div>
        </div>
        <div className="card" style={{borderTop:'3px solid var(--color-success)', textAlign:'center'}}>
          <div style={{fontSize:'0.8rem',color:'var(--text-muted)',fontWeight:600,letterSpacing:'0.05em'}}>TOTAL ACTUAL</div>
          <div style={{fontSize:'2.5rem',fontWeight:800,color:'var(--color-success)',margin:'0.5rem 0'}}>{totalActual.toLocaleString()}</div>
          <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>pieces produced</div>
        </div>
        <div className="card" style={{borderTop:`3px solid ${slColor(overallSL)}`, textAlign:'center'}}>
          <div style={{fontSize:'0.8rem',color:'var(--text-muted)',fontWeight:600,letterSpacing:'0.05em'}}>SERVICE LEVEL (SL%)</div>
          <div style={{fontSize:'2.5rem',fontWeight:800,color:slColor(overallSL),margin:'0.5rem 0'}}>{overallSL.toFixed(1)}%</div>
          <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{onTarget} on-target | {atRisk} at-risk</div>
        </div>
        <div className="card" style={{borderTop:'3px solid var(--color-warning)', textAlign:'center'}}>
          <div style={{fontSize:'0.8rem',color:'var(--text-muted)',fontWeight:600,letterSpacing:'0.05em'}}>BULK REQUIRED</div>
          <div style={{fontSize:'2.5rem',fontWeight:800,color:'var(--color-warning)',margin:'0.5rem 0'}}>{(totalBulk/1000).toFixed(1)}</div>
          <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>tonnes total</div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">SKU Performance — {MONTHS[month-1]} {year}</h2>
          <div style={{display:'flex', gap:'0.75rem', fontSize:'0.8rem'}}>
            <span style={{padding:'0.25rem 0.75rem',borderRadius:'999px',backgroundColor:'rgba(16,185,129,0.1)',color:'var(--color-success)'}}>■ ≥95% On Target</span>
            <span style={{padding:'0.25rem 0.75rem',borderRadius:'999px',backgroundColor:'rgba(245,158,11,0.1)',color:'var(--color-warning)'}}>■ 80-95% Caution</span>
            <span style={{padding:'0.25rem 0.75rem',borderRadius:'999px',backgroundColor:'rgba(239,68,68,0.1)',color:'var(--color-danger)'}}>■ &lt;80% At Risk</span>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SKU Code</th>
                <th>Description</th>
                <th>Brand</th>
                <th>Family</th>
                <th>Machine</th>
                <th>Volume</th>
                <th>Monthly Plan</th>
                <th>Total Act.</th>
                <th>Balance</th>
                <th>Bulk (KG)</th>
                <th style={{minWidth:'130px'}}>SL%</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={11} style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>Loading summary...</td></tr>
              )}
              {!loading && plans.length === 0 && (
                <tr><td colSpan={11} style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>
                  No data. <a href="/planning" style={{color:'var(--color-primary)'}}>Import MPS</a> first.
                </td></tr>
              )}
              {plans.map((p, i) => {
                const sl = p.sl || 0;
                const balance = p.targetQty - (p.totalActual || 0);
                return (
                  <tr key={i} style={{backgroundColor: slBg(sl)}}>
                    <td style={{fontFamily:'monospace',fontSize:'0.82rem'}}>{p.product?.skuCode}</td>
                    <td style={{maxWidth:'240px'}}>
                      <div style={{fontWeight:500,fontSize:'0.9rem'}}>{p.product?.nameEn}</div>
                      {p.product?.nameAr && <div style={{fontSize:'0.75rem',direction:'rtl',color:'var(--text-muted)'}}>{p.product.nameAr}</div>}
                    </td>
                    <td style={{fontSize:'0.85rem'}}>{p.product?.brand || '—'}</td>
                    <td style={{fontSize:'0.85rem'}}>{p.product?.family || '—'}</td>
                    <td><span style={{fontSize:'0.75rem',padding:'2px 8px',backgroundColor:'var(--bg-main)',borderRadius:'4px',border:'1px solid var(--border-light)'}}>{p.machineName || '—'}</span></td>
                    <td style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>{p.product?.packSizeMl || '—'}</td>
                    <td style={{fontWeight:600,textAlign:'right'}}>{p.targetQty?.toLocaleString()}</td>
                    <td style={{fontWeight:600,textAlign:'right',color:'var(--color-primary)'}}>{(p.totalActual || 0).toLocaleString()}</td>
                    <td style={{textAlign:'right', fontWeight:600,
                      color: balance > 0 ? 'var(--color-danger)' : 'var(--color-success)'}}>
                      {balance > 0 ? `(${balance.toLocaleString()})` : `+${Math.abs(balance).toLocaleString()}`}
                    </td>
                    <td style={{textAlign:'right',color:'var(--text-muted)',fontSize:'0.85rem'}}>{p.bulkKg?.toFixed(1)}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                        <div style={{flex:1,height:'8px',backgroundColor:'var(--border-light)',borderRadius:'999px',overflow:'hidden'}}>
                          <div style={{width:`${Math.min(sl,100)}%`,height:'100%',backgroundColor:slColor(sl),borderRadius:'999px',transition:'width 0.4s ease'}}/>
                        </div>
                        <span style={{fontWeight:700,color:slColor(sl),minWidth:'40px',textAlign:'right'}}>{sl.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {plans.length > 0 && (
                <tr style={{borderTop:'2px solid var(--border-light)',backgroundColor:'var(--bg-main)',fontWeight:700}}>
                  <td colSpan={6} style={{textAlign:'right',paddingRight:'1rem'}}>TOTALS</td>
                  <td style={{textAlign:'right'}}>{totalTarget.toLocaleString()}</td>
                  <td style={{textAlign:'right',color:'var(--color-primary)'}}>{totalActual.toLocaleString()}</td>
                  <td style={{textAlign:'right',color: totalTarget-totalActual>0?'var(--color-danger)':'var(--color-success)'}}>
                    {(totalTarget-totalActual > 0 ? `(${(totalTarget-totalActual).toLocaleString()})` : `+${Math.abs(totalTarget-totalActual).toLocaleString()}`)}
                  </td>
                  <td style={{textAlign:'right'}}>{totalBulk.toFixed(1)}</td>
                  <td><span style={{color:slColor(overallSL),fontWeight:800}}>{overallSL.toFixed(1)}%</span></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
