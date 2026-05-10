'use client';
import { useState, useEffect } from 'react';

export default function MaterialReadiness() {
  const [readiness, setReadiness] = useState<any[]>([]);
  const [prepData, setPrepData] = useState<any>(null);
  useEffect(() => {
    fetch('/api/stores/readiness').then(r=>r.json()).then(d => setReadiness(Array.isArray(d.data)?d.data:[]));
    fetch(`/api/preparation?year=${new Date().getFullYear()}&month=${new Date().getMonth()+1}`).then(r=>r.json()).then(d => setPrepData(d.data||d));
  }, []);

  const ready = readiness.filter(r => r.status === 'READY').length;
  const shortage = readiness.filter(r => r.status === 'SHORTAGE').length;

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>Material Readiness</h1>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span className="role-tag role-planning">Planning</span>
          <span className="role-tag role-stores">Stores</span>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>
      <div className="grid-cols-4">
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-success)'}}>
          <div className="stat-title">Ready</div>
          <div className="stat-value" style={{color:'var(--color-success)'}}>{ready}</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-danger)'}}>
          <div className="stat-title">Shortage</div>
          <div className="stat-value" style={{color:'var(--color-danger)'}}>{shortage}</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-primary)'}}>
          <div className="stat-title">Total SKUs</div>
          <div className="stat-value text-gradient">{readiness.length}</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-warning)'}}>
          <div className="stat-title">Bulk Required</div>
          <div className="stat-value" style={{color:'var(--color-warning)'}}>
            {((prepData?.totals?.totalBulkRequired || 0) / 1000).toFixed(1)}t
          </div>
        </div>
      </div>
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Plan Readiness Dashboard</h2></div>
        <div className="table-container">
          <table>
            <thead><tr><th>SKU</th><th>Product</th><th>Line</th><th>Target</th><th>Bulk (KG)</th><th>Status</th></tr></thead>
            <tbody>
              {readiness.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>No plan data. Create MPS plans first.</td></tr>
              ) : readiness.map((r: any, i: number) => (
                <tr key={i} style={{backgroundColor: r.status === 'SHORTAGE' ? 'rgba(239,68,68,0.05)' : ''}}>
                  <td style={{fontFamily:'monospace',fontSize:'0.8rem'}}>{r.sku}</td>
                  <td>{r.description}</td>
                  <td><span className="badge badge-running">{r.line}</span></td>
                  <td style={{fontWeight:600}}>{(r.target||0).toLocaleString()}</td>
                  <td>{r.bulkNeeded}</td>
                  <td><span className={`badge ${r.status==='SHORTAGE'?'badge-stopped':'badge-running'}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
