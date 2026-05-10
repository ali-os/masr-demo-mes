'use client';
import { useState, useEffect } from 'react';

export default function ProductionEntry() {
  const [plans, setPlans] = useState<any[]>([]);
  const [entries, setEntries] = useState<Record<string, any>>({});
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Generate all working days in the selected month
  const getDays = () => {
    const days = [];
    const d = new Date(year, month - 1, 1);
    while (d.getMonth() === month - 1) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  };

  const fetchData = async () => {
    const [plansRes, entriesRes] = await Promise.all([
      fetch(`/api/mps?year=${year}&month=${month}`).then(r => r.json()),
      fetch(`/api/daily-entry?year=${year}&month=${month}`).then(r => r.json())
    ]);
    setPlans(Array.isArray(plansRes.data) ? plansRes.data : Array.isArray(plansRes) ? plansRes : []);

    // Index entries: key = planId_date_shift
    const entryMap: Record<string, any> = {};
    const entryList = Array.isArray(entriesRes.data) ? entriesRes.data : Array.isArray(entriesRes) ? entriesRes : [];
    entryList.forEach((e: any) => {
      const key = `${e.monthlyPlanId}_${e.date.split('T')[0]}_${e.shift}`;
      entryMap[key] = e;
    });
    setEntries(entryMap);
  };

  useEffect(() => { fetchData(); }, [year, month]);

  const handleCellChange = (planId: string, productId: string, date: string, shift: number, qty: number) => {
    const key = `${planId}_${date}_${shift}`;
    setEntries(prev => ({
      ...prev,
      [key]: { ...prev[key], monthlyPlanId: planId, productId, date, shift, actualQty: qty }
    }));
  };

  const handleCellBlur = async (planId: string, productId: string, date: string, shift: number) => {
    const key = `${planId}_${date}_${shift}`;
    const entry = entries[key];
    if (!entry || entry.actualQty === undefined) return;

    setSaving(key);
    await fetch('/api/daily-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthlyPlanId: planId, productId, date, shift, actualQty: entry.actualQty })
    });
    setSaving(null);
    setSaved(prev => new Set(prev).add(key));
    setTimeout(() => setSaved(prev => { const n = new Set(prev); n.delete(key); return n; }), 1500);
  };

  const getCellTotal = (planId: string, days: Date[]) => {
    let total = 0;
    days.forEach(d => {
      const date = d.toISOString().split('T')[0];
      [1, 2].forEach(shift => {
        const key = `${planId}_${date}_${shift}`;
        total += Number(entries[key]?.actualQty || 0);
      });
    });
    return total;
  };

  const days = getDays();
  // Only show days that have data OR current month
  const visibleDays = days.slice(0, 31);

  return (
    <div>
      <div className="card-header">
        <div>
          <h1 className="card-title" style={{fontSize:'2rem'}}>Daily Production Entry</h1>
          <p style={{color:'var(--text-muted)', fontSize:'0.9rem', marginTop:'0.25rem'}}>
            Enter actual quantities per shift — replaces W-1/W-2/W-3 sheets
          </p>
        </div>
        <div style={{display:'flex', gap:'0.75rem'}}>
          <select className="input-field" style={{width:'auto', padding:'0.5rem'}}
            value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input-field" style={{width:'auto', padding:'0.5rem'}}
            value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <a href="/production/summary" className="btn btn-outline">📊 Summary View</a>
          <a href={`/api/export/production?year=${year}&month=${month}`} className="btn btn-primary">📤 Export</a>
        </div>
      </div>

      <div className="card" style={{padding:0, overflowX:'auto'}}>
        {plans.length === 0 ? (
          <div style={{padding:'4rem', textAlign:'center', color:'var(--text-muted)'}}>
            <div style={{fontSize:'3rem', marginBottom:'1rem'}}>📋</div>
            <div style={{fontSize:'1.1rem', fontWeight:600}}>No plan data for {MONTHS[month-1]} {year}</div>
            <div style={{marginTop:'0.5rem'}}>Go to <a href="/planning" style={{color:'var(--color-primary)'}}>Planning</a> to import your MPS first.</div>
          </div>
        ) : (
          <table style={{minWidth:'max-content'}}>
            <thead>
              <tr style={{backgroundColor:'var(--bg-main)'}}>
                <th style={{position:'sticky',left:0,backgroundColor:'var(--bg-main)',zIndex:2,minWidth:'120px'}}>SKU Code</th>
                <th style={{position:'sticky',left:'120px',backgroundColor:'var(--bg-main)',zIndex:2,minWidth:'200px'}}>Product</th>
                <th style={{minWidth:'100px'}}>Machine</th>
                <th style={{minWidth:'90px',borderRight:'2px solid var(--border-light)'}}>Monthly<br/>Target</th>
                {visibleDays.map(d => (
                  <th key={d.toISOString()} colSpan={2} style={{textAlign:'center',minWidth:'120px',borderRight:'1px solid var(--border-light)'}}>
                    {d.toLocaleDateString('en',{day:'2-digit',month:'short'})}
                  </th>
                ))}
                <th style={{minWidth:'90px',borderLeft:'2px solid var(--border-light)'}}>Total<br/>Actual</th>
                <th style={{minWidth:'70px'}}>SL%</th>
              </tr>
              <tr style={{backgroundColor:'var(--bg-main)', fontSize:'0.75rem', color:'var(--text-muted)'}}>
                <th style={{position:'sticky',left:0,backgroundColor:'var(--bg-main)',zIndex:2}}/>
                <th style={{position:'sticky',left:'120px',backgroundColor:'var(--bg-main)',zIndex:2}}/>
                <th/><th style={{borderRight:'2px solid var(--border-light)'}}/>
                {visibleDays.map(d => (
                  <>
                    <th key={`${d.toISOString()}_sh1`} style={{textAlign:'center',fontWeight:500}}>Sh 1</th>
                    <th key={`${d.toISOString()}_sh2`} style={{textAlign:'center',fontWeight:500,borderRight:'1px solid var(--border-light)'}}>Sh 2</th>
                  </>
                ))}
                <th style={{borderLeft:'2px solid var(--border-light)'}}/><th/>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan, pi) => {
                const totalActual = getCellTotal(plan.id, visibleDays);
                const sl = plan.targetQty > 0 ? (totalActual / plan.targetQty * 100) : 0;
                const slColor = sl >= 95 ? 'var(--color-success)' : sl >= 80 ? 'var(--color-warning)' : 'var(--color-danger)';
                return (
                  <tr key={plan.id} style={{borderBottom:'1px solid var(--border-light)'}}>
                    <td style={{position:'sticky',left:0,backgroundColor:'var(--bg-card)',zIndex:1,fontFamily:'monospace',fontSize:'0.8rem'}}>
                      {plan.product?.skuCode}
                    </td>
                    <td style={{position:'sticky',left:'120px',backgroundColor:'var(--bg-card)',zIndex:1,maxWidth:'200px'}}>
                      <div style={{fontWeight:500,fontSize:'0.85rem'}}>{plan.product?.nameEn}</div>
                      {plan.product?.nameAr && <div style={{fontSize:'0.75rem',direction:'rtl',color:'var(--text-muted)'}}>{plan.product.nameAr}</div>}
                    </td>
                    <td><span style={{fontSize:'0.75rem',backgroundColor:'var(--bg-main)',padding:'0.2rem 0.5rem',borderRadius:'4px'}}>{plan.machineName || '—'}</span></td>
                    <td style={{fontWeight:700,borderRight:'2px solid var(--border-light)',textAlign:'right'}}>{plan.targetQty?.toLocaleString()}</td>
                    {visibleDays.map(d => {
                      const dateStr = d.toISOString().split('T')[0];
                      return [1, 2].map(shift => {
                        const key = `${plan.id}_${dateStr}_${shift}`;
                        const val = entries[key]?.actualQty ?? '';
                        const isSaving = saving === key;
                        const isSaved = saved.has(key);
                        return (
                          <td key={`${dateStr}_${shift}`}
                            style={{padding:'2px 4px', borderRight: shift===2?'1px solid var(--border-light)':undefined, backgroundColor: isSaved?'rgba(16,185,129,0.08)':undefined}}>
                            <input
                              type="number"
                              min="0"
                              value={val}
                              style={{
                                width:'56px', padding:'4px 6px', border:'1px solid transparent',
                                borderRadius:'4px', textAlign:'right', fontSize:'0.85rem',
                                backgroundColor: isSaving?'rgba(245,158,11,0.1)':val?'transparent':'transparent',
                                fontFamily:'monospace', outline:'none',
                                color:'var(--text-main)'
                              }}
                              onFocus={e => (e.target.style.border='1px solid var(--color-primary)')}
                              onBlur={e => { e.target.style.border='1px solid transparent'; handleCellBlur(plan.id, plan.productId, dateStr, shift); }}
                              onChange={e => handleCellChange(plan.id, plan.productId, dateStr, shift, Number(e.target.value))}
                            />
                          </td>
                        );
                      });
                    })}
                    <td style={{fontWeight:700,borderLeft:'2px solid var(--border-light)',textAlign:'right',color:'var(--color-primary)'}}>
                      {totalActual.toLocaleString()}
                    </td>
                    <td style={{fontWeight:700, color: slColor}}>{sl.toFixed(0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{marginTop:'1rem', fontSize:'0.8rem', color:'var(--text-muted)', display:'flex', gap:'1.5rem'}}>
        <span>💡 <strong>Click any cell</strong> to enter shift quantity — saved automatically on focus loss</span>
        <span style={{display:'flex', alignItems:'center', gap:'0.4rem'}}><span style={{width:'12px',height:'12px',borderRadius:'3px',backgroundColor:'rgba(16,185,129,0.15)',display:'inline-block'}}/> = saved</span>
        <span style={{display:'flex', alignItems:'center', gap:'0.4rem'}}><span style={{width:'12px',height:'12px',borderRadius:'3px',backgroundColor:'rgba(245,158,11,0.1)',display:'inline-block'}}/> = saving...</span>
      </div>
    </div>
  );
}
