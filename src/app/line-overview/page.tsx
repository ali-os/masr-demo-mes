'use client';
import { useState, useEffect } from 'react';

export default function LineOverview() {
  const [machines, setMachines] = useState<any[]>([]);
  const [oee, setOee] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/machines').then(r=>r.json()).then(d => setMachines(Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : []));
    fetch(`/api/analytics?year=${new Date().getFullYear()}&month=${new Date().getMonth()+1}`).then(r=>r.json()).then(d => setOee(d.data?.byMachine || []));
  }, []);

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>Line Overview</h1>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span className="role-tag role-supervisor">Supervisors</span>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>
      <div className="grid-cols-4">
        {oee.length > 0 ? oee.map((m: any, i: number) => (
          <div key={i} className="card stat-card">
            <div className="stat-title">{m.name}</div>
            <div className="stat-value" style={{color: m.avgOEE >= 80 ? 'var(--color-success)' : m.avgOEE >= 60 ? 'var(--color-warning)' : 'var(--color-danger)'}}>{m.avgOEE}%</div>
            <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>{m.records} records | {m.totalOutput.toLocaleString()} pcs</div>
          </div>
        )) : (
          <>
            <div className="card stat-card"><div className="stat-title">Line OEE</div><div className="stat-value" style={{color:'var(--text-muted)'}}>—</div><div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>No OEE data yet</div></div>
          </>
        )}
      </div>
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Registered Machines</h2></div>
        <div className="table-container">
          <table>
            <thead><tr><th>Machine</th><th>Code</th><th>Type</th><th>Line</th></tr></thead>
            <tbody>
              {machines.length === 0 ? (
                <tr><td colSpan={4} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>No machines registered</td></tr>
              ) : machines.map((m: any, i: number) => (
                <tr key={i}><td style={{fontWeight:600}}>{m.name}</td><td style={{fontFamily:'monospace'}}>{m.code}</td><td>{m.type}</td><td>{m.line?.name || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
