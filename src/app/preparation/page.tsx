'use client';
import { useState, useEffect } from 'react';

export default function Preparation() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [year] = useState(new Date().getFullYear());
  const [month] = useState(new Date().getMonth() + 1);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/preparation?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => { setData(d.data || d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year, month]);

  const totals = data?.totals || {};
  const bulkReqs = data?.bulkRequirements || [];
  const byCategory = data?.byCategory || {};
  const overallProgress = totals.totalBulkRequired > 0 ? (totals.totalBulkUsed / totals.totalBulkRequired * 100) : 0;

  return (
    <div>
      <div className="card-header">
        <div>
          <h1 className="card-title" style={{fontSize:'2rem'}}>Preparation & Mixing</h1>
          <p style={{color:'var(--text-muted)', fontSize:'0.9rem', marginTop:'0.25rem'}}>
            {MONTHS[month-1]} {year} — Bulk requirements from MPS
          </p>
        </div>
        <div style={{display:'flex', gap:'0.5rem'}}>
          <span className="role-tag role-quality">Preparation</span>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-4">
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-primary)'}}>
          <div className="stat-title">Total Bulk Required</div>
          <div className="stat-value text-gradient">{((totals.totalBulkRequired || 0) / 1000).toFixed(2)}t</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>tonnes for {totals.skuCount || 0} SKUs</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-success)'}}>
          <div className="stat-title">Bulk Consumed</div>
          <div className="stat-value" style={{color:'var(--color-success)'}}>{((totals.totalBulkUsed || 0) / 1000).toFixed(2)}t</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>used in production</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-warning)'}}>
          <div className="stat-title">Remaining to Prepare</div>
          <div className="stat-value" style={{color:'var(--color-warning)'}}>
            {(((totals.totalBulkRequired || 0) - (totals.totalBulkUsed || 0)) / 1000).toFixed(2)}t
          </div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>still needed</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-primary)'}}>
          <div className="stat-title">Overall Progress</div>
          <div className="stat-value" style={{color:'var(--color-primary)'}}>{overallProgress.toFixed(1)}%</div>
          <div style={{width:'100%', height:'6px', backgroundColor:'var(--border-light)', borderRadius:'999px', marginTop:'0.5rem'}}>
            <div style={{width:`${Math.min(overallProgress, 100)}%`, height:'100%', backgroundColor:'var(--color-primary)', borderRadius:'999px'}}></div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card" style={{marginTop:'1.5rem', marginBottom:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Bulk by Product Category</h2></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'1rem'}}>
          {Object.entries(byCategory).map(([cat, vals]: [string, any]) => {
            const pct = vals.total > 0 ? (vals.used / vals.total * 100) : 0;
            return (
              <div key={cat} style={{padding:'1rem', borderRadius:'var(--radius-md)', border:'1px solid var(--border-light)', backgroundColor:'var(--bg-surface)'}}>
                <div style={{fontWeight:700, fontSize:'0.9rem', marginBottom:'0.5rem'}}>{cat}</div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'0.5rem'}}>
                  <span>{vals.count} SKUs</span>
                  <span>{vals.total.toFixed(0)} KG</span>
                </div>
                <div style={{width:'100%', height:'6px', backgroundColor:'var(--border-light)', borderRadius:'999px'}}>
                  <div style={{width:`${Math.min(pct, 100)}%`, height:'100%', backgroundColor: pct >= 80 ? 'var(--color-success)' : 'var(--color-warning)', borderRadius:'999px', transition:'width 0.4s'}}></div>
                </div>
                <div style={{fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.25rem', textAlign:'right'}}>{pct.toFixed(0)}% consumed</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Bulk Requirements Table */}
      <div className="card">
        <div className="card-header"><h2 className="card-title">Detailed Bulk Requirements per SKU</h2><span style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>{bulkReqs.length} items</span></div>
        <div className="table-container" style={{maxHeight:'500px', overflowY:'auto'}}>
          <table>
            <thead>
              <tr>
                <th>SKU</th><th>Product</th><th>Machine</th><th>Template</th>
                <th>Ratio</th><th>Target (pcs)</th><th>Bulk Req (KG)</th>
                <th>Consumed (KG)</th><th>Remaining</th><th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{textAlign:'center', padding:'3rem', color:'var(--text-muted)'}}>Loading preparation data...</td></tr>
              ) : bulkReqs.length === 0 ? (
                <tr><td colSpan={10} style={{textAlign:'center', padding:'3rem', color:'var(--text-muted)'}}>No MPS data. Create a plan first.</td></tr>
              ) : bulkReqs.map((b: any, i: number) => (
                <tr key={i} style={{backgroundColor: b.bulkRemaining > 100 ? 'rgba(245,158,11,0.03)' : ''}}>
                  <td style={{fontFamily:'monospace', fontSize:'0.8rem'}}>{b.sku}</td>
                  <td style={{fontSize:'0.85rem'}}>{b.nameEn}</td>
                  <td><span className="source-tag source-manual" style={{fontSize:'0.7rem'}}>{b.machine || '—'}</span></td>
                  <td style={{fontSize:'0.75rem', color:'var(--color-primary)'}}>{b.templateName || '—'}</td>
                  <td style={{fontFamily:'monospace', fontSize:'0.8rem'}}>{b.ratio}</td>
                  <td style={{fontWeight:600}}>{b.targetQty.toLocaleString()}</td>
                  <td style={{fontWeight:700, color:'var(--color-primary)'}}>{b.bulkRequired.toLocaleString()}</td>
                  <td style={{color:'var(--color-success)'}}>{b.bulkUsed}</td>
                  <td style={{color: b.bulkRemaining > 0 ? 'var(--color-warning)' : 'var(--color-success)', fontWeight:600}}>
                    {b.bulkRemaining.toLocaleString()}
                  </td>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                      <div style={{flex:1, height:'6px', backgroundColor:'var(--border-light)', borderRadius:'999px', minWidth:'60px'}}>
                        <div style={{width:`${Math.min(b.progress, 100)}%`, height:'100%', backgroundColor: b.progress >= 80 ? 'var(--color-success)' : 'var(--color-warning)', borderRadius:'999px'}}></div>
                      </div>
                      <span style={{fontSize:'0.75rem', fontWeight:600, minWidth:'35px'}}>{b.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
