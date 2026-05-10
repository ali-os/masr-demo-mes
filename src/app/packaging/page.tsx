'use client';
import { useState, useEffect } from 'react';

export default function Packaging() {
  const [plans, setPlans] = useState<any[]>([]);
  useEffect(() => {
    fetch(`/api/work-orders?year=${new Date().getFullYear()}&month=${new Date().getMonth()+1}`).then(r=>r.json()).then(d => setPlans(Array.isArray(d.data)?d.data:[]));
  }, []);

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>Packaging Materials</h1>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span className="role-tag role-stores">Stores</span>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>
      <div className="grid-cols-4">
        <div className="card stat-card"><div className="stat-title">SKUs Requiring Packaging</div><div className="stat-value text-gradient">{plans.length}</div></div>
        <div className="card stat-card"><div className="stat-title">Total Plan (pcs)</div><div className="stat-value" style={{color:'var(--color-primary)'}}>{plans.reduce((s,p)=>s+p.monthlyTarget,0).toLocaleString()}</div></div>
      </div>
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Packaging Requirements by SKU</h2></div>
        <div className="table-container">
          <table>
            <thead><tr><th>SKU</th><th>Product</th><th>Brand</th><th>Machine</th><th>Monthly Target</th><th>Actual</th><th>Packing Status</th></tr></thead>
            <tbody>
              {plans.length === 0 ? (
                <tr><td colSpan={7} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>No plan data. Create MPS plans first.</td></tr>
              ) : plans.map((p: any, i: number) => (
                <tr key={i}>
                  <td style={{fontFamily:'monospace',fontSize:'0.8rem'}}>{p.sku}</td>
                  <td>{p.nameEn}</td>
                  <td>{p.brand}</td>
                  <td style={{fontSize:'0.8rem'}}>{p.machine||'—'}</td>
                  <td style={{fontWeight:600}}>{p.monthlyTarget.toLocaleString()}</td>
                  <td style={{color:'var(--color-success)',fontWeight:600}}>{p.totalActual.toLocaleString()}</td>
                  <td><span className={`badge ${p.totalActual >= p.monthlyTarget ? 'badge-running' : 'badge-waiting'}`}>
                    {p.totalActual >= p.monthlyTarget ? 'Complete' : 'In Progress'}
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
