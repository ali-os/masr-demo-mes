'use client';
import { useState, useEffect } from 'react';

export default function MissedDowntime() {
  const [oee, setOee] = useState<any[]>([]);
  useEffect(() => {
    fetch(`/api/oee?year=${new Date().getFullYear()}&month=${new Date().getMonth()+1}`).then(r=>r.json()).then(d => setOee(Array.isArray(d.data)?d.data:Array.isArray(d)?d:[]));
  }, []);

  // Find records with low availability but no coded downtime
  const missed = oee.filter((r: any) => {
    const totalCoded = (r.adjustMins||0)+(r.mechFailMins||0)+(r.minorStopMins||0)+(r.changeoverMins||0)+(r.utilityMins||0)+(r.waitMins||0)+(r.manageMins||0);
    const lostTime = (r.plannedTimeMins||480) - (r.plannedTimeMins||480) * (r.availability||0) / 100;
    return lostTime > 30 && totalCoded < lostTime * 0.5;
  });

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>Missed Downtime Detection</h1>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span className="role-tag role-supervisor">Supervisors</span>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>
      <div className="grid-cols-4">
        <div className="card stat-card"><div className="stat-title">OEE Records</div><div className="stat-value text-gradient">{oee.length}</div></div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-warning)'}}>
          <div className="stat-title">Suspected Missed</div>
          <div className="stat-value" style={{color:'var(--color-warning)'}}>{missed.length}</div>
        </div>
      </div>
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Records with Unaccounted Downtime</h2></div>
        <div className="table-container">
          <table>
            <thead><tr><th>Date</th><th>Machine</th><th>Shift</th><th>Availability</th><th>Coded (min)</th><th>Status</th></tr></thead>
            <tbody>
              {missed.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>
                  {oee.length === 0 ? 'No OEE data yet. Log machine data first.' : 'All downtime is properly accounted for ✅'}
                </td></tr>
              ) : missed.map((r: any, i: number) => {
                const coded = (r.adjustMins||0)+(r.mechFailMins||0)+(r.minorStopMins||0)+(r.changeoverMins||0)+(r.utilityMins||0)+(r.waitMins||0)+(r.manageMins||0);
                return (
                  <tr key={i}>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>{r.machine?.name || r.machineId}</td>
                    <td>S{r.shift}</td>
                    <td style={{color:'var(--color-warning)',fontWeight:600}}>{r.availability}%</td>
                    <td>{Math.round(coded)}m</td>
                    <td><span className="badge badge-waiting">⚠ Review</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
