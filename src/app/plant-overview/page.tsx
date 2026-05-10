'use client';
import { useState, useEffect } from 'react';

export default function PlantOverview() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch('/api/dashboard/stats').then(r => r.json()).then(d => setData(d.data || d));
  }, []);

  const lines = data ? [
    { name: 'Line 1 – High Speed', status: 'Active', color: 'var(--color-success)' },
    { name: 'Line 2', status: 'Active', color: 'var(--color-success)' },
    { name: 'Line 3 – Specialty', status: 'No Order', color: 'var(--text-muted)' },
  ] : [];

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>Plant Overview</h1>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span className="role-tag role-manager">Managers</span>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>
      <div className="grid-cols-4">
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-primary)'}}>
          <div className="stat-title">Plant OEE</div>
          <div className="stat-value" style={{color:'var(--color-primary)'}}>{data?.oee?.average || 0}%</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>Target: 80%</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-success)'}}>
          <div className="stat-title">Lines Active</div>
          <div className="stat-value" style={{color:'var(--color-success)'}}>{data?.mps?.activeSKUs ? '2 / 3' : '0 / 3'}</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-warning)'}}>
          <div className="stat-title">MPS Target</div>
          <div className="stat-value" style={{color:'var(--color-warning)'}}>{(data?.mps?.total || 0).toLocaleString()}</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid #8B5CF6'}}>
          <div className="stat-title">Plan Attainment</div>
          <div className="stat-value" style={{color:'#8B5CF6'}}>{data?.production?.sl || 0}%</div>
        </div>
      </div>

      <div className="grid-cols-2" style={{gridTemplateColumns:'repeat(3, 1fr)', marginTop:'1.5rem'}}>
        {lines.map((line,i)=>(
          <div className="card" key={i}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <strong style={{fontSize:'1.1rem'}}>{line.name}</strong>
              <span className="badge" style={{color: line.color}}>{line.status}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.75rem'}}>
              <div><div style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>OEE</div><div style={{fontWeight:700,fontSize:'1.5rem'}}>{data?.oee?.average || 0}%</div></div>
              <div><div style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>SL%</div><div style={{fontWeight:700,fontSize:'1.5rem'}}>{data?.production?.sl || 0}%</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
