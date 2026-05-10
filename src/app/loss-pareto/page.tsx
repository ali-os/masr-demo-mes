'use client';
import { useState, useEffect } from 'react';

export default function LossPareto() {
  const [oee, setOee] = useState<any[]>([]);
  const [year] = useState(new Date().getFullYear());
  const [month] = useState(new Date().getMonth() + 1);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    fetch(`/api/oee?year=${year}&month=${month}`).then(r=>r.json()).then(d => setOee(Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : []));
  }, [year, month]);

  // Aggregate downtime buckets from OEE records
  const buckets = [
    { code: 'ADJ', desc: 'Setup & Adjustment', bucket: 'Availability', dur: 0 },
    { code: 'MF', desc: 'Mechanical Failure', bucket: 'Availability', dur: 0 },
    { code: 'MIN', desc: 'Minor Stops', bucket: 'Performance', dur: 0 },
    { code: 'CO', desc: 'Changeover', bucket: 'Availability', dur: 0 },
    { code: 'QL', desc: 'Quality Loss', bucket: 'Quality', dur: 0 },
    { code: 'UT', desc: 'Utility (Power/Air)', bucket: 'Availability', dur: 0 },
    { code: 'WH', desc: 'Waiting Material', bucket: 'Availability', dur: 0 },
    { code: 'MG', desc: 'Management Loss', bucket: 'Availability', dur: 0 },
  ];

  oee.forEach((r: any) => {
    buckets[0].dur += r.adjustMins || 0;
    buckets[1].dur += r.mechFailMins || 0;
    buckets[2].dur += r.minorStopMins || 0;
    buckets[3].dur += r.changeoverMins || 0;
    buckets[4].dur += r.qualityLossMins || 0;
    buckets[5].dur += r.utilityMins || 0;
    buckets[6].dur += r.waitMins || 0;
    buckets[7].dur += r.manageMins || 0;
  });

  const sorted = [...buckets].filter(b => b.dur > 0).sort((a, b) => b.dur - a.dur);
  const totalLoss = sorted.reduce((s, b) => s + b.dur, 0);
  let cumulative = 0;

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>Loss Pareto Analysis</h1>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span className="role-tag role-manager">Ops Excellence</span>
          <span className="source-tag source-calculated">LIVE</span>
          <span style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>{MONTHS[month-1]} {year} — {oee.length} records</span>
        </div>
      </div>
      <div className="card" style={{marginBottom:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Top Losses — Pareto Chart</h2></div>
        {sorted.length === 0 ? (
          <div style={{padding:'3rem',textAlign:'center',color:'var(--text-muted)'}}>No OEE loss data. Log machine losses in OEE & Loss Entry first.</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            {sorted.map((l, i) => {
              const pct = totalLoss > 0 ? Math.round(l.dur / totalLoss * 100) : 0;
              cumulative += pct;
              const barColor = l.bucket === 'Availability' ? 'linear-gradient(90deg,var(--color-danger),#F97316)' : l.bucket === 'Performance' ? 'linear-gradient(90deg,var(--color-warning),#FBBF24)' : 'linear-gradient(90deg,#EC4899,#8B5CF6)';
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                  <div style={{width:'140px',fontSize:'0.8rem',fontWeight:500,flexShrink:0}}>{l.code} — {l.desc}</div>
                  <div style={{flex:1,height:'28px',backgroundColor:'rgba(0,0,0,0.3)',borderRadius:'var(--radius-sm)',position:'relative'}}>
                    <div style={{height:'100%',width:`${pct * 2.5}%`,background:barColor,borderRadius:'var(--radius-sm)',display:'flex',alignItems:'center',paddingLeft:'0.5rem',fontSize:'0.75rem',fontWeight:600,minWidth:'40px'}}>{Math.round(l.dur)}m</div>
                  </div>
                  <div style={{width:'50px',textAlign:'right',fontSize:'0.8rem',color:'var(--text-muted)'}}>{pct}%</div>
                  <div style={{width:'60px',textAlign:'right',fontSize:'0.75rem',color:'var(--color-primary)',fontWeight:600}}>{cumulative}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="card">
        <div className="card-header"><h2 className="card-title">Loss Detail Table</h2></div>
        <div className="table-container">
          <table>
            <thead><tr><th>Rank</th><th>Code</th><th>Description</th><th>OEE Bucket</th><th>Total (min)</th><th>Total (hrs)</th><th>% of Total</th></tr></thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={7} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>No data</td></tr>
              ) : sorted.map((l, i) => (
                <tr key={i}><td>{i+1}</td><td style={{fontWeight:600}}>{l.code}</td><td>{l.desc}</td><td>{l.bucket}</td><td style={{fontWeight:600}}>{Math.round(l.dur)}</td><td>{(l.dur/60).toFixed(1)}</td><td>{totalLoss > 0 ? Math.round(l.dur/totalLoss*100) : 0}%</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
