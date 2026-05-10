'use client';
import { useState, useEffect } from 'react';

export default function Alerts() {
  const [data, setData] = useState<any>(null);
  const [readiness, setReadiness] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/dashboard/stats').then(r=>r.json()).then(d=>setData(d.data||d));
    fetch('/api/stores/readiness').then(r=>r.json()).then(d=>setReadiness(Array.isArray(d.data)?d.data:[]));
  }, []);

  // Generate alerts from real data
  const alerts: any[] = [];
  const shortages = readiness.filter((r: any) => r.status === 'SHORTAGE');
  shortages.forEach((s: any) => {
    alerts.push({ type: 'Material Shortage', msg: `${s.description} (${s.sku}) — Bulk needed: ${s.bulkNeeded} KG`, sev: 'high', target: 'Stores, Planning', icon: '📦' });
  });
  if ((data?.oee?.average || 0) < 70) {
    alerts.push({ type: 'Low OEE', msg: `Plant OEE is ${data?.oee?.average}% — below 70% threshold`, sev: 'high', target: 'Supervisor, Maintenance', icon: '⚠️' });
  }
  if ((data?.production?.sl || 0) < 50 && (data?.production?.sl || 0) > 0) {
    alerts.push({ type: 'Plan At Risk', msg: `Service Level at ${data?.production?.sl}% — below 50% mid-month`, sev: 'medium', target: 'Planning, Management', icon: '📊' });
  }
  if ((data?.quality?.rejects || 0) > 100) {
    alerts.push({ type: 'Reject Volume', msg: `${data?.quality?.rejects} rejects this month — above threshold`, sev: 'medium', target: 'Quality, Supervisor', icon: '🔬' });
  }
  if (alerts.length === 0) {
    alerts.push({ type: 'All Clear', msg: 'No active alerts. All systems within normal parameters.', sev: 'ok', target: 'System', icon: '✅' });
  }

  const critical = alerts.filter(a=>a.sev==='high').length;
  const medium = alerts.filter(a=>a.sev==='medium').length;

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>Alert Center</h1>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span className="role-tag role-supervisor">All Roles</span>
          <span className="source-tag source-calculated">LIVE</span>
          {critical > 0 && <span className="badge badge-stopped">{critical} Critical</span>}
        </div>
      </div>
      <div className="grid-cols-4">
        <div className="card stat-card"><div className="stat-title">Critical</div><div className="stat-value" style={{color:'var(--color-danger)'}}>{critical}</div></div>
        <div className="card stat-card"><div className="stat-title">Medium</div><div className="stat-value" style={{color:'var(--color-warning)'}}>{medium}</div></div>
        <div className="card stat-card"><div className="stat-title">Total Alerts</div><div className="stat-value text-gradient">{alerts.length}</div></div>
        <div className="card stat-card"><div className="stat-title">Shortages</div><div className="stat-value" style={{color:'var(--color-danger)'}}>{shortages.length}</div></div>
      </div>
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Active Alerts</h2></div>
        {alerts.map((a,i)=>(
          <div key={i} style={{padding:'1.25rem',border:`1px solid ${a.sev==='high'?'rgba(239,68,68,0.3)':'var(--border-light)'}`,borderRadius:'var(--radius-md)',marginBottom:'0.75rem',backgroundColor:a.sev==='high'?'rgba(239,68,68,0.03)':'transparent'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.5rem'}}>
              <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
                <span style={{fontSize:'1.25rem'}}>{a.icon}</span>
                <strong>{a.type}</strong>
              </div>
              <span className={`badge ${a.sev==='high'?'badge-stopped':a.sev==='medium'?'badge-waiting':'badge-running'}`}>{a.sev}</span>
            </div>
            <div style={{fontSize:'0.875rem',color:'var(--text-muted)',marginBottom:'0.5rem'}}>{a.msg}</div>
            <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>→ {a.target}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
