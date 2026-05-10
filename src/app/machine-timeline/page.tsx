'use client';
import { useState, useEffect } from 'react';

export default function MachineTimeline() {
  const [oee, setOee] = useState<any[]>([]);
  useEffect(() => {
    fetch(`/api/analytics?year=${new Date().getFullYear()}&month=${new Date().getMonth()+1}`).then(r=>r.json()).then(d => setOee(d.data?.oeeTrend || []));
  }, []);

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>Machine Timeline</h1>
        <span className="source-tag source-calculated">LIVE</span>
      </div>
      <div className="card">
        <div className="card-header"><h2 className="card-title">Daily OEE Timeline</h2></div>
        {oee.length === 0 ? (
          <div style={{padding:'3rem',textAlign:'center',color:'var(--text-muted)'}}>No OEE data. Log machine data in OEE & Loss Entry.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Date</th><th>OEE</th><th>Availability</th><th>Performance</th><th>Quality</th><th>Output</th><th>Rejects</th></tr></thead>
              <tbody>
                {oee.map((d: any, i: number) => (
                  <tr key={i}>
                    <td style={{fontWeight:500}}>{new Date(d.day).toLocaleDateString()}</td>
                    <td style={{fontWeight:700,color: d.oee >= 80 ? 'var(--color-success)' : d.oee >= 60 ? 'var(--color-warning)' : 'var(--color-danger)'}}>{d.oee}%</td>
                    <td>{d.availability}%</td><td>{d.performance}%</td><td>{d.quality}%</td>
                    <td>{d.output.toLocaleString()}</td><td style={{color: d.rejects > 0 ? 'var(--color-danger)' : 'var(--text-muted)'}}>{d.rejects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
