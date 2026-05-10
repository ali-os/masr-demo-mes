'use client';
import { useState, useEffect } from 'react';

export default function WorkOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [activeWeek, setActiveWeek] = useState('W1');

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/work-orders?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d.data) ? d.data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year, month]);

  // Calculate week totals
  const weekTotals = orders.reduce((acc, o) => {
    const week = o.weeks?.[activeWeek];
    if (week) {
      acc.target += week.target;
      acc.actual += week.actual;
    }
    return acc;
  }, { target: 0, actual: 0 });

  // Get day columns for active week
  const getDayCols = () => {
    const firstOrder = orders.find(o => o.weeks?.[activeWeek]);
    if (!firstOrder) return [];
    const days = Object.keys(firstOrder.weeks[activeWeek]?.days || {});
    return days.map(d => {
      const date = new Date(d);
      return { key: d, label: DAYS[date.getDay()], day: date.getDate() };
    });
  };
  const dayCols = getDayCols();

  const overallTarget = orders.reduce((s, o) => s + o.monthlyTarget, 0);
  const overallActual = orders.reduce((s, o) => s + o.totalActual, 0);

  return (
    <div>
      <div className="card-header">
        <div>
          <h1 className="card-title" style={{fontSize:'2rem'}}>Weekly Work Order Schedule</h1>
          <p style={{color:'var(--text-muted)', fontSize:'0.9rem', marginTop:'0.25rem'}}>
            {MONTHS[month-1]} {year} — Live from MPS database
          </p>
        </div>
        <div style={{display:'flex',gap:'0.75rem', alignItems:'center'}}>
          <select className="input-field" style={{width:'auto', padding:'0.5rem'}} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input-field" style={{width:'auto', padding:'0.5rem'}} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>

      {/* Week Tabs */}
      <div className="card" style={{marginBottom:'1.5rem'}}>
        <div style={{display:'flex', gap:'0.5rem'}}>
          {['W1','W2','W3','W4'].map(w => (
            <button key={w} className={`btn ${activeWeek === w ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveWeek(w)}>
              {w}
            </button>
          ))}
          <div style={{marginLeft:'auto', display:'flex', gap:'1.5rem', fontSize:'0.85rem', alignItems:'center'}}>
            <span>Week Target: <strong>{weekTotals.target.toLocaleString()}</strong></span>
            <span>Week Actual: <strong style={{color:'var(--color-success)'}}>{weekTotals.actual.toLocaleString()}</strong></span>
            <span>Month: <strong>{overallActual.toLocaleString()}</strong> / {overallTarget.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Work Order Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{activeWeek} — Daily SKU Allocation</h2>
          <span style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>{orders.length} SKUs</span>
        </div>
        <div className="table-container" style={{maxHeight:'600px', overflowY:'auto'}}>
          <table>
            <thead>
              <tr>
                <th>Code</th><th>Brand</th><th>Family</th><th>SKU</th><th>Machine</th>
                <th>{activeWeek} Target</th><th>Bulk (kg)</th>
                {dayCols.map(d => (
                  <th key={d.key} style={{backgroundColor:'rgba(59,130,246,0.08)', fontSize:'0.75rem'}}>{d.label} {d.day}</th>
                ))}
                <th>Actual</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10 + dayCols.length} style={{textAlign:'center', padding:'3rem', color:'var(--text-muted)'}}>Loading work orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={10 + dayCols.length} style={{textAlign:'center', padding:'3rem', color:'var(--text-muted)'}}>
                  No MPS data. <a href="/planning" style={{color:'var(--color-primary)'}}>Create a plan</a> first.
                </td></tr>
              ) : orders.map((o, i) => {
                const week = o.weeks?.[activeWeek];
                if (!week) return null;
                return (
                  <tr key={i}>
                    <td style={{fontFamily:'monospace', fontSize:'0.8rem'}}>{o.sku}</td>
                    <td style={{fontSize:'0.8rem'}}>{o.brand}</td>
                    <td style={{fontSize:'0.8rem'}}>{o.family}</td>
                    <td style={{direction:'rtl', maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'0.8rem'}}>
                      {o.nameAr || o.nameEn}
                    </td>
                    <td><span className="source-tag source-manual" style={{fontSize:'0.7rem'}}>{o.machine || '—'}</span></td>
                    <td style={{fontWeight:600}}>{week.target.toLocaleString()}</td>
                    <td style={{fontSize:'0.8rem', color:'var(--color-primary)'}}>{((o.bulkKg || 0) / 4).toFixed(0)}</td>
                    {dayCols.map(d => (
                      <td key={d.key} style={{backgroundColor:'rgba(59,130,246,0.03)', fontSize:'0.8rem', textAlign:'center'}}>
                        {week.days[d.key] ? week.days[d.key].toLocaleString() : ''}
                      </td>
                    ))}
                    <td style={{color:'var(--color-success)', fontWeight:600}}>
                      {week.actual > 0 ? week.actual.toLocaleString() : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header">
          <h2 className="card-title">Production Summary (Plan vs Actual)</h2>
          <a href={`/api/export/production?year=${year}&month=${month}`} className="btn btn-outline" style={{fontSize:'0.8rem'}}>📤 Export</a>
        </div>
        <div className="table-container" style={{maxHeight:'400px', overflowY:'auto'}}>
          <table>
            <thead>
              <tr>
                <th>Code</th><th>Brand</th><th>Family</th><th>Description</th>
                <th>Monthly Plan</th><th>Total Prod</th><th>Balance</th><th>SL%</th>
                <th>W1</th><th>W2</th><th>W3</th><th>W4</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => {
                const balance = o.monthlyTarget - o.totalActual;
                const slColor = o.sl >= 95 ? 'var(--color-success)' : o.sl >= 80 ? 'var(--color-warning)' : o.sl > 0 ? 'var(--color-danger)' : 'var(--text-muted)';
                return (
                  <tr key={i}>
                    <td style={{fontFamily:'monospace', fontSize:'0.8rem'}}>{o.sku}</td>
                    <td style={{fontSize:'0.8rem'}}>{o.brand}</td>
                    <td style={{fontSize:'0.8rem'}}>{o.family}</td>
                    <td style={{direction:'rtl', fontSize:'0.8rem'}}>{o.nameAr || o.nameEn}</td>
                    <td style={{fontWeight:600}}>{o.monthlyTarget.toLocaleString()}</td>
                    <td style={{fontWeight:600, color:'var(--color-success)'}}>{o.totalActual.toLocaleString()}</td>
                    <td style={{color: balance > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight:600}}>
                      {balance > 0 ? `(${balance.toLocaleString()})` : `+${Math.abs(balance).toLocaleString()}`}
                    </td>
                    <td style={{fontWeight:700, color: slColor}}>{o.sl}%</td>
                    {['W1','W2','W3','W4'].map(w => (
                      <td key={w} style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>
                        {o.weeks?.[w]?.actual > 0 ? o.weeks[w].actual.toLocaleString() : '—'}
                      </td>
                    ))}
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
