'use client';
import { useState, useEffect } from 'react';

export default function ShiftCockpit() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch('/api/dashboard/stats').then(r=>r.json()).then(d=>setData(d.data||d));
  }, []);

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>Shift Cockpit</h1>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span className="role-tag role-supervisor">Shift Lead</span>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>
      <div className="grid-cols-4">
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-success)'}}>
          <div className="stat-title">Today Output</div>
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
          <div className="stat-title">Rejects</div>
          <div className="stat-value" style={{color:'var(--color-danger)'}}>{(data?.quality?.rejects || 0).toLocaleString()}</div>
        </div>
      </div>
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Quick Actions</h2></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>
          {[
            {href:'/production',icon:'✏️',label:'Enter Shift Data'},
            {href:'/production/oee',icon:'⏱️',label:'Log OEE & Losses'},
            {href:'/quality',icon:'🔬',label:'Log Rejects'},
          ].map((a,i)=>(
            <a key={i} href={a.href} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.5rem',padding:'1.5rem',borderRadius:'12px',border:'1px solid var(--border-light)',textDecoration:'none',color:'var(--text-main)'}}>
              <span style={{fontSize:'2rem'}}>{a.icon}</span>
              <span style={{fontWeight:600}}>{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
