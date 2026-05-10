'use client';
import { useState, useEffect } from 'react';

export default function MaintenanceConsole() {
  const [machines, setMachines] = useState<any[]>([]);
  const [oeeData, setOeeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/machines').then(r=>r.json()),
      fetch(`/api/analytics?year=${new Date().getFullYear()}&month=${new Date().getMonth()+1}`).then(r=>r.json()),
    ]).then(([mach, analytics]) => {
      setMachines(Array.isArray(mach.data) ? mach.data : Array.isArray(mach) ? mach : []);
      setOeeData(analytics.data?.byMachine || []);
      setLoading(false);
    });
  }, []);

  // Calculate maintenance metrics from OEE data
  const totalDowntime = oeeData.reduce((s: number, m: any) => s + (m.totalDowntime || 0), 0);
  const avgOEE = oeeData.length > 0 ? oeeData.reduce((s: number, m: any) => s + m.avgOEE, 0) / oeeData.length : 0;
  const worstMachine = oeeData.length > 0 ? oeeData.reduce((worst: any, m: any) => m.avgOEE < (worst?.avgOEE || 999) ? m : worst, oeeData[0]) : null;

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>Maintenance Console</h1>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span className="role-tag role-admin">Maintenance</span>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>

      <div className="grid-cols-4">
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-danger)'}}>
          <div className="stat-title">Total Downtime</div>
          <div className="stat-value" style={{color:'var(--color-danger)'}}>{(totalDowntime / 60).toFixed(1)} hrs</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>this month</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-primary)'}}>
          <div className="stat-title">Machines Registered</div>
          <div className="stat-value text-gradient">{machines.length}</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-warning)'}}>
          <div className="stat-title">Avg Availability</div>
          <div className="stat-value" style={{color:'var(--color-warning)'}}>{avgOEE.toFixed(1)}%</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>plant-wide OEE</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-danger)'}}>
          <div className="stat-title">Worst Performer</div>
          <div className="stat-value" style={{fontSize:'1.2rem',color:'var(--color-danger)'}}>{worstMachine?.name || '—'}</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>{worstMachine ? `${worstMachine.avgOEE}% OEE` : 'No data'}</div>
        </div>
      </div>

      {/* Machine Health */}
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Machine Health Dashboard</h2></div>
        <div className="table-container">
          <table>
            <thead><tr><th>Machine</th><th>Code</th><th>Type</th><th>OEE</th><th>Downtime</th><th>Output</th><th>Health</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>Loading machine data...</td></tr>
              ) : machines.length === 0 ? (
                <tr><td colSpan={7} style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>No machines registered</td></tr>
              ) : machines.map((m: any, i: number) => {
                const mOee = oeeData.find((o: any) => o.name === m.name);
                const oee = mOee?.avgOEE || 0;
                return (
                  <tr key={i}>
                    <td style={{fontWeight:600}}>{m.name}</td>
                    <td style={{fontFamily:'monospace',fontSize:'0.8rem'}}>{m.code}</td>
                    <td>{m.type}</td>
                    <td style={{fontWeight:700,color: oee >= 80 ? 'var(--color-success)' : oee >= 60 ? 'var(--color-warning)' : oee > 0 ? 'var(--color-danger)' : 'var(--text-muted)'}}>{oee > 0 ? `${oee}%` : '—'}</td>
                    <td style={{color:'var(--color-danger)'}}>{mOee ? `${(mOee.totalDowntime/60).toFixed(1)} hrs` : '—'}</td>
                    <td>{mOee ? mOee.totalOutput.toLocaleString() : '—'}</td>
                    <td>
                      <span className={`badge ${oee >= 80 ? 'badge-running' : oee >= 60 ? 'badge-waiting' : oee > 0 ? 'badge-stopped' : 'badge-waiting'}`}>
                        {oee >= 80 ? 'Good' : oee >= 60 ? 'Monitor' : oee > 0 ? 'Needs Attention' : 'No Data'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Maintenance Actions</h2></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>
          {[
            {href:'/production/oee',icon:'⏱️',label:'Log Downtime',desc:'Record machine stops'},
            {href:'/machine-detail',icon:'🖥️',label:'Machine Cards',desc:'View details'},
            {href:'/loss-pareto',icon:'📊',label:'Loss Analysis',desc:'Pareto chart'},
          ].map((a,i)=>(
            <a key={i} href={a.href} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.5rem',padding:'1.5rem',borderRadius:'12px',border:'1px solid var(--border-light)',textDecoration:'none',color:'var(--text-main)',backgroundColor:'var(--bg-surface)'}}>
              <span style={{fontSize:'2rem'}}>{a.icon}</span>
              <span style={{fontWeight:600}}>{a.label}</span>
              <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{a.desc}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
