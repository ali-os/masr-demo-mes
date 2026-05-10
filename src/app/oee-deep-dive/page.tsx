'use client';
import { useState, useEffect } from 'react';

export default function OEEDeepDive() {
  const [data, setData] = useState<any>(null);
  const [year] = useState(new Date().getFullYear());
  const [month] = useState(new Date().getMonth() + 1);
  useEffect(() => {
    fetch(`/api/analytics?year=${year}&month=${month}`).then(r=>r.json()).then(d=>setData(d.data||d));
  }, [year, month]);

  const s = data?.summary || {};
  const a = s.avgA || 0, p = s.avgP || 0, q = s.avgQ || 0, oee = s.avgOEE || 0;

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>OEE Deep Dive</h1>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span className="role-tag role-supervisor">Supervisors</span>
          <span className="role-tag role-manager">Managers</span>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>
      <div className="grid-cols-2" style={{gridTemplateColumns:'1fr 2fr'}}>
        <div className="card" style={{textAlign:'center',borderTop:'3px solid var(--color-primary)'}}>
          <div className="stat-title">OEE</div>
          <div className="stat-value" style={{color:'var(--color-primary)',fontSize:'3.5rem'}}>{oee}%</div>
          <div style={{marginTop:'1rem',fontSize:'0.85rem',color:'var(--text-muted)'}}>= {a}% × {p}% × {q}%</div>
          <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:'0.25rem'}}>Availability × Performance × Quality</div>
          <div style={{marginTop:'1rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>{s.recordCount || 0} machine-shift records analyzed</div>
        </div>
        <div className="card">
          <div className="card-header"><h2 className="card-title">Formula Breakdown</h2><span className="source-tag source-calculated">SYSTEM_CALCULATED</span></div>
          <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
            {[
              {name:'Availability', val: a, color:'var(--color-warning)', formula:'run_time / planned_production_time', note:`${s.totalDowntimeHrs || 0} hrs total downtime this month`},
              {name:'Performance', val: p, color:'var(--color-success)', formula:'(ideal_cycle_time × total_count) / run_time', note:`${(s.totalOutput || 0).toLocaleString()} pieces output`},
              {name:'Quality', val: q, color:'#8B5CF6', formula:'good_count / total_count', note:`${(s.totalRejects || 0).toLocaleString()} rejects this month`},
            ].map((f,i)=>(
              <div key={i} style={{padding:'1rem',border:'1px solid var(--border-light)',borderRadius:'var(--radius-md)'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}>
                  <strong>{f.name}</strong>
                  <span style={{fontWeight:700,fontSize:'1.25rem',color:f.color}}>{f.val}%</span>
                </div>
                <div style={{width:'100%',height:'8px',backgroundColor:'var(--border-light)',borderRadius:'5px',marginBottom:'0.5rem'}}>
                  <div style={{width:`${Math.min(f.val,100)}%`,height:'100%',backgroundColor:f.color,borderRadius:'5px'}}></div>
                </div>
                <code style={{fontSize:'0.8rem',color:'var(--color-primary)',display:'block',marginBottom:'0.5rem'}}>{f.formula}</code>
                <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{f.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
