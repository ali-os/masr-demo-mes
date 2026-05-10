'use client';
import { useState, useEffect } from 'react';

export default function MachineDetail() {
  const [machines, setMachines] = useState<any[]>([]);
  const [oee, setOee] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/machines').then(r=>r.json()).then(d => setMachines(Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : []));
    fetch(`/api/analytics?year=${new Date().getFullYear()}&month=${new Date().getMonth()+1}`).then(r=>r.json()).then(d => setOee(d.data?.byMachine || []));
  }, []);

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>Machine Detail</h1>
        <span className="source-tag source-calculated">LIVE</span>
      </div>
      <div className="grid-cols-2" style={{gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))'}}>
        {machines.length === 0 ? (
          <div className="card" style={{padding:'3rem',textAlign:'center',color:'var(--text-muted)'}}>No machines registered</div>
        ) : machines.map((m: any, i: number) => {
          const mOee = oee.find((o: any) => o.name === m.name);
          return (
            <div className="card" key={i} style={{borderTop:'3px solid var(--color-primary)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1rem'}}>
                <strong style={{fontSize:'1.1rem'}}>{m.name}</strong>
                <span className="badge badge-running">{m.type}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}>
                <span style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>Code: {m.code}</span>
                <span style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>Line: {m.line?.name || '—'}</span>
              </div>
              {mOee && (
                <div style={{marginTop:'1rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.85rem'}}>
                    <span>OEE</span><span style={{fontWeight:700,color: mOee.avgOEE >= 80 ? 'var(--color-success)' : 'var(--color-warning)'}}>{mOee.avgOEE}%</span>
                  </div>
                  <div style={{width:'100%',height:'6px',backgroundColor:'var(--border-light)',borderRadius:'5px',marginTop:'0.25rem'}}>
                    <div style={{width:`${Math.min(mOee.avgOEE,100)}%`,height:'100%',backgroundColor: mOee.avgOEE >= 80 ? 'var(--color-success)' : 'var(--color-warning)',borderRadius:'5px'}}></div>
                  </div>
                  <div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:'0.5rem'}}>{mOee.records} records | {mOee.totalOutput.toLocaleString()} output | {(mOee.totalDowntime/60).toFixed(1)} hrs downtime</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
