'use client';
import { useState, useEffect } from 'react';

export default function Operator() {
  const [plans, setPlans] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then(r=>r.json()),
      fetch(`/api/work-orders?year=${new Date().getFullYear()}&month=${new Date().getMonth()+1}`).then(r=>r.json()),
    ]).then(([stats, wo]) => {
      setData(stats.data || stats);
      setPlans(Array.isArray(wo.data) ? wo.data : []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>Line Operator Console</h1>
        <div style={{display:'flex',gap:'0.5rem', alignItems:'center'}}>
          <span className="role-tag role-operator">Operator</span>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>

      {/* Quick KPIs */}
      <div className="grid-cols-4">
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-success)'}}>
          <div className="stat-title">Today's Output</div>
          <div className="stat-value" style={{color:'var(--color-success)'}}>{(data?.production?.today || 0).toLocaleString()}</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-primary)'}}>
          <div className="stat-title">Month Total</div>
          <div className="stat-value" style={{color:'var(--color-primary)'}}>{(data?.production?.total || 0).toLocaleString()}</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-warning)'}}>
          <div className="stat-title">OEE</div>
          <div className="stat-value" style={{color:'var(--color-warning)'}}>{data?.oee?.average || 0}%</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-danger)'}}>
          <div className="stat-title">Quality</div>
          <div className="stat-value" style={{color: (data?.quality?.rate || 100) >= 99 ? 'var(--color-success)' : 'var(--color-warning)'}}>{data?.quality?.rate || 100}%</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Operator Quick Actions</h2></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem'}}>
          {[
            {href:'/production',icon:'✏️',label:'Enter Shift Data',desc:'Daily production entry'},
            {href:'/production/oee',icon:'⏱️',label:'Log OEE & Losses',desc:'Downtime & quality'},
            {href:'/quality',icon:'🔬',label:'Log Rejects',desc:'Quality events'},
            {href:'/live-board',icon:'📺',label:'Live Board',desc:'Real-time status'},
          ].map((a,i)=>(
            <a key={i} href={a.href} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.5rem',padding:'1.5rem',borderRadius:'12px',border:'1px solid var(--border-light)',textDecoration:'none',color:'var(--text-main)',backgroundColor:'var(--bg-surface)',transition:'all 0.2s'}}>
              <span style={{fontSize:'2rem'}}>{a.icon}</span>
              <span style={{fontWeight:600,fontSize:'0.9rem'}}>{a.label}</span>
              <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{a.desc}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Current Line Orders */}
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Active Work Orders</h2></div>
        <div className="table-container" style={{maxHeight:'400px',overflowY:'auto'}}>
          <table>
            <thead><tr><th>SKU</th><th>Product</th><th>Machine</th><th>Target</th><th>Actual</th><th>SL%</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>Loading...</td></tr>
              ) : plans.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>No active work orders. Create MPS plans first.</td></tr>
              ) : plans.slice(0,10).map((p: any, i: number) => (
                <tr key={i}>
                  <td style={{fontFamily:'monospace',fontSize:'0.8rem'}}>{p.sku}</td>
                  <td>{p.nameEn}</td>
                  <td><span className="badge badge-running" style={{fontSize:'0.7rem'}}>{p.machine || '—'}</span></td>
                  <td style={{fontWeight:600}}>{p.monthlyTarget.toLocaleString()}</td>
                  <td style={{color:'var(--color-success)',fontWeight:600}}>{p.totalActual.toLocaleString()}</td>
                  <td style={{fontWeight:700,color: p.sl >= 95 ? 'var(--color-success)' : p.sl >= 80 ? 'var(--color-warning)' : 'var(--color-danger)'}}>{p.sl}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
