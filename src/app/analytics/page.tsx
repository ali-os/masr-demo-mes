'use client';
import { useState, useEffect } from 'react';

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => { setData(d.data || d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year, month]);

  const summary = data?.summary || {};
  const oeeTrend = data?.oeeTrend || [];
  const productionTrend = data?.productionTrend || [];
  const byMachine = data?.byMachine || [];

  const maxOEE = Math.max(...oeeTrend.map((d: any) => d.oee), 1);
  const maxProd = Math.max(...productionTrend.map((d: any) => d.qty), 1);

  return (
    <div>
      <div className="card-header">
        <div>
          <h1 className="card-title" style={{fontSize:'2rem'}}>Historical Analytics</h1>
          <p style={{color:'var(--text-muted)', fontSize:'0.9rem', marginTop:'0.25rem'}}>
            {MONTHS[month-1]} {year} — {summary.recordCount || 0} OEE records analyzed
          </p>
        </div>
        <div style={{display:'flex', gap:'0.75rem', alignItems:'center'}}>
          <select className="input-field" style={{width:'auto', padding:'0.5rem'}} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input-field" style={{width:'auto', padding:'0.5rem'}} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-4">
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-primary)'}}>
          <div className="stat-title">Avg OEE</div>
          <div className="stat-value" style={{color:'var(--color-primary)'}}>{summary.avgOEE || 0}%</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>{summary.recordCount || 0} machine-shift records</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-success)'}}>
          <div className="stat-title">Total Output</div>
          <div className="stat-value" style={{color:'var(--color-success)'}}>{(summary.totalOutput || 0).toLocaleString()}</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>pieces</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-danger)'}}>
          <div className="stat-title">Total Downtime</div>
          <div className="stat-value" style={{color:'var(--color-danger)'}}>{summary.totalDowntimeHrs || 0} hrs</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>all loss categories</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-warning)'}}>
          <div className="stat-title">Total Rejects</div>
          <div className="stat-value" style={{color:'var(--color-warning)'}}>{(summary.totalRejects || 0).toLocaleString()}</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>pieces rejected</div>
        </div>
      </div>

      <div className="grid-cols-2" style={{marginTop:'1.5rem'}}>
        {/* OEE Trend Chart */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">OEE Daily Trend</h2></div>
          {oeeTrend.length === 0 ? (
            <div style={{padding:'3rem', textAlign:'center', color:'var(--text-muted)'}}>No OEE data. Log machine losses in OEE & Loss Entry.</div>
          ) : (
            <div style={{display:'flex', alignItems:'flex-end', gap:'3px', height:'200px', padding:'1rem 0'}}>
              {oeeTrend.map((d: any, i: number) => (
                <div key={i} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.25rem'}}>
                  <span style={{fontSize:'0.6rem', color:'var(--text-muted)'}}>{d.oee}%</span>
                  <div style={{
                    width:'100%', height:`${(d.oee / 100) * 160}px`,
                    background:`linear-gradient(to top, var(--color-primary), ${d.oee >= 80 ? 'var(--color-success)' : d.oee >= 60 ? 'var(--color-warning)' : 'var(--color-danger)'})`,
                    borderRadius:'4px 4px 0 0', opacity:0.85, minHeight:'4px'
                  }}></div>
                  <span style={{fontSize:'0.55rem', color:'var(--text-muted)'}}>{new Date(d.day).getDate()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* A / P / Q Breakdown */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">A / P / Q Breakdown</h2></div>
          <div style={{display:'flex', flexDirection:'column', gap:'1.5rem', padding:'1rem 0'}}>
            {[
              { label: 'Availability', val: summary.avgA || 0, color: 'var(--color-warning)' },
              { label: 'Performance', val: summary.avgP || 0, color: 'var(--color-success)' },
              { label: 'Quality', val: summary.avgQ || 0, color: '#8B5CF6' },
            ].map((m, i) => (
              <div key={i}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.5rem'}}>
                  <span style={{fontWeight:500}}>{m.label}</span>
                  <span style={{fontWeight:700, color: m.color}}>{m.val}%</span>
                </div>
                <div style={{width:'100%', height:'10px', backgroundColor:'var(--border-light)', borderRadius:'5px'}}>
                  <div style={{width:`${Math.min(m.val, 100)}%`, height:'100%', backgroundColor: m.color, borderRadius:'5px', transition:'width 0.4s'}}></div>
                </div>
              </div>
            ))}
            <div style={{marginTop:'0.5rem', padding:'1rem', backgroundColor:'var(--bg-main)', borderRadius:'var(--radius-md)', textAlign:'center'}}>
              <div style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Overall OEE</div>
              <div style={{fontSize:'2.5rem', fontWeight:900, color:'var(--color-primary)'}}>{summary.avgOEE || 0}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Production Trend */}
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Daily Production Output</h2></div>
        {productionTrend.length === 0 ? (
          <div style={{padding:'3rem', textAlign:'center', color:'var(--text-muted)'}}>No production data. Enter daily shift production first.</div>
        ) : (
          <div style={{display:'flex', alignItems:'flex-end', gap:'3px', height:'180px', padding:'1rem 0'}}>
            {productionTrend.map((d: any, i: number) => (
              <div key={i} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.25rem'}}>
                <span style={{fontSize:'0.55rem', color:'var(--text-muted)'}}>{(d.qty / 1000).toFixed(0)}k</span>
                <div style={{
                  width:'100%', height:`${(d.qty / maxProd) * 140}px`,
                  background:'linear-gradient(to top, var(--color-success), #10B981aa)',
                  borderRadius:'4px 4px 0 0', opacity:0.8, minHeight:'4px'
                }}></div>
                <span style={{fontSize:'0.55rem', color:'var(--text-muted)'}}>{new Date(d.day).getDate()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Machine Performance Table */}
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Machine Performance</h2></div>
        <div className="table-container">
          <table>
            <thead><tr><th>Machine</th><th>Records</th><th>Avg OEE</th><th>Total Output</th><th>Total Downtime</th></tr></thead>
            <tbody>
              {byMachine.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign:'center', padding:'2rem', color:'var(--text-muted)'}}>No machine OEE data yet</td></tr>
              ) : byMachine.map((m: any, i: number) => (
                <tr key={i}>
                  <td style={{fontWeight:600}}>{m.name}</td>
                  <td>{m.records}</td>
                  <td style={{fontWeight:700, color: m.avgOEE >= 80 ? 'var(--color-success)' : m.avgOEE >= 60 ? 'var(--color-warning)' : 'var(--color-danger)'}}>
                    {m.avgOEE}%
                  </td>
                  <td>{m.totalOutput.toLocaleString()}</td>
                  <td style={{color:'var(--color-danger)'}}>{(m.totalDowntime / 60).toFixed(1)} hrs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
