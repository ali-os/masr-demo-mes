'use client';
import { useState, useEffect, useRef } from 'react';
import masterData from '@/lib/master-data.json';

export default function Planning() {
  const [plans, setPlans] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  const [role, setRole] = useState('PLANNER');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [targetQty, setTargetQty] = useState(0);
  const [machineName, setMachineName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const fetchPlans = () => {
    setLoading(true);
    fetch(`/api/mps?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => { setPlans(Array.isArray(d.data) ? d.data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    setRole(localStorage.getItem('user-role') || 'PLANNER');
    fetch('/api/products')
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d.data) ? d.data : []));
  }, []);

  useEffect(() => { fetchPlans(); }, [year, month]);

  const handleProductSelect = (val: string) => {
    // Try to find by SKU (exact match) first
    let p = products.find(x => x.skuCode === val);
    
    // If not found, try to split by ' - ' (datalist format)
    if (!p && val.includes(' - ')) {
      const sku = val.split(' - ')[0];
      p = products.find(x => x.skuCode === sku);
    }

    // If still not found, try to find by Name (case insensitive)
    if (!p) {
      p = products.find(x => x.nameEn?.toLowerCase() === val.toLowerCase());
    }

    setSelectedProduct(p || null);
    if (p?.compatibleLines?.length > 0) setMachineName(p.compatibleLines[0]);
  };

  const handleAddPlan = async () => {
    if (!selectedProduct || !targetQty) return;
    const res = await fetch('/api/mps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        year, 
        month, 
        productId: selectedProduct.id, 
        machineName: machineName || (selectedProduct.compatibleLines?.[0] || ''), 
        targetQty 
      })
    });
    
    if (res.ok) {
      setModalOpen(false);
      setSelectedProduct(null);
      setTargetQty(0);
      fetchPlans();
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportResult(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'MONTHLY_PLAN'); // Fix: was DAILY_PROD
    fd.append('year', String(year));
    fd.append('month', String(month));
    const res = await fetch('/api/import', { method: 'POST', body: fd });
    const result = await res.json();
    setImportResult(result);
    setIsImporting(false);
    fetchPlans();
  };

  const handleExport = () => {
    window.location.href = `/api/export/production?year=${year}&month=${month}`;
  };

  const totalTarget = plans.reduce((s, p) => s + (p.targetQty || 0), 0);
  const totalActual = plans.reduce((s, p) => s + (p.totalActual || 0), 0);
  const overallSL = totalTarget > 0 ? (totalActual / totalTarget * 100).toFixed(1) : '0';

  return (
    <div>
      {/* Header */}
      <div className="card-header">
        <div>
          <h1 className="card-title" style={{fontSize:'2rem'}}>Production Planning (MPS)</h1>
          <p style={{color:'var(--text-muted)', fontSize:'0.9rem', marginTop:'0.25rem'}}>
            Monthly Production Schedule — {MONTHS[month-1]} {year}
          </p>
        </div>
        <div style={{display:'flex', gap:'0.75rem', alignItems:'center'}}>
          <select className="input-field" style={{width:'auto', padding:'0.5rem'}}
            value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input-field" style={{width:'auto', padding:'0.5rem'}}
            value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-outline" onClick={handleExport}>📤 Export Excel</button>
          <label className="btn btn-outline" style={{cursor:'pointer'}}>
            {isImporting ? '⏳ Importing...' : '📥 Import Excel'}
            <input ref={fileRef} type="file" accept=".xlsb,.xlsx,.xls" style={{display:'none'}} onChange={handleImport} />
          </label>
          {(role === 'ADMIN' || role === 'PLANNER') && (
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Add Plan</button>
          )}
        </div>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div style={{
          padding:'1rem 1.5rem', borderRadius:'var(--radius-md)', marginBottom:'1.5rem',
          backgroundColor: importResult.error ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          border: `1px solid ${importResult.error ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
          color: importResult.error ? 'var(--color-danger)' : 'var(--color-success)'
        }}>
          {importResult.error
            ? `❌ Import failed: ${importResult.error}`
            : `✅ Import successful — ${importResult.inserted} records inserted, ${importResult.skipped} skipped.`}
          {importResult.warnings?.length > 0 && (
            <div style={{fontSize:'0.8rem', marginTop:'0.5rem', opacity:0.8}}>
              ⚠️ {importResult.warnings.slice(0,3).join(' | ')}
            </div>
          )}
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid-cols-4" style={{marginBottom:'1.5rem'}}>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-primary)'}}>
          <div className="stat-title">Monthly Target</div>
          <div className="stat-value" style={{color:'var(--color-primary)'}}>{totalTarget.toLocaleString()}</div>
          <div style={{fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.25rem'}}>Total pieces planned</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-success)'}}>
          <div className="stat-title">Total Actual</div>
          <div className="stat-value" style={{color:'var(--color-success)'}}>{totalActual.toLocaleString()}</div>
          <div style={{fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.25rem'}}>Pieces produced</div>
        </div>
        <div className="card stat-card" style={{borderTop: `3px solid ${Number(overallSL)>=95?'var(--color-success)':Number(overallSL)>=80?'var(--color-warning)':'var(--color-danger)'}`}}>
          <div className="stat-title">Service Level (SL%)</div>
          <div className="stat-value" style={{color: Number(overallSL)>=95?'var(--color-success)':Number(overallSL)>=80?'var(--color-warning)':'var(--color-danger)'}}>
            {overallSL}%
          </div>
          <div style={{fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.25rem'}}>Plan achievement</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-warning)'}}>
          <div className="stat-title">Active SKUs</div>
          <div className="stat-value" style={{color:'var(--color-warning)'}}>{plans.length}</div>
          <div style={{fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.25rem'}}>In this month's plan</div>
        </div>
      </div>

      {/* MPS Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Monthly Plan — {MONTHS[month-1]} {year}</h2>
          <span style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>{plans.length} SKUs</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SKU Code</th>
                <th>Description</th>
                <th>Brand</th>
                <th>Family</th>
                <th>Machine</th>
                <th>Target (pcs)</th>
                <th>Bulk (KG)</th>
                <th>Est. Time</th>
                <th>Actual</th>
                <th>Balance</th>
                <th>SL%</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{textAlign:'center', padding:'3rem', color:'var(--text-muted)'}}>
                  <div className="loader" style={{margin:'0 auto 1rem'}}/>
                  Loading plan data...
                </td></tr>
              ) : plans.length === 0 ? (
                <tr><td colSpan={11} style={{textAlign:'center', padding:'4rem', color:'var(--text-muted)'}}>
                  <div style={{fontSize:'3rem', marginBottom:'1rem'}}>📅</div>
                  <h3>No production plans for {MONTHS[month-1]} {year}</h3>
                  <p style={{marginTop:'0.5rem'}}>Click <strong>Import Excel</strong> to load a monthly report, or <strong>Add Plan</strong> to create one manually.</p>
                </td></tr>
              ) : plans.map((p, i) => {
                const sl = p.sl || 0;
                const slColor = sl >= 95 ? 'var(--color-success)' : sl >= 80 ? 'var(--color-warning)' : 'var(--color-danger)';
                const balance = p.targetQty - (p.totalActual || 0);
                return (
                  <tr key={i}>
                    <td style={{fontFamily:'monospace', fontSize:'0.85rem'}}>{p.product?.skuCode}</td>
                    <td style={{maxWidth:'250px'}}>
                      <div style={{fontWeight:500}}>{p.product?.nameEn}</div>
                      {p.product?.nameAr && <div style={{fontSize:'0.8rem', direction:'rtl', color:'var(--text-muted)'}}>{p.product.nameAr}</div>}
                    </td>
                    <td>{p.product?.brand}</td>
                    <td>{p.product?.family}</td>
                    <td><span className="source-tag source-manual">{p.machineName || '—'}</span></td>
                    <td style={{fontWeight:600}}>{p.targetQty?.toLocaleString()}</td>
                    <td style={{color:'var(--color-primary)'}}>{p.bulkKg?.toFixed(1)}</td>
                    <td style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>
                      {(() => {
                        const speed = (p.product?.idealSpeed && p.product.idealSpeed > 0) 
                          ? p.product.idealSpeed 
                          : (p.product?.template?.idealSpeed || 0);
                        return speed > 0 ? `${Math.ceil(p.targetQty / speed / 60)}h` : '—';
                      })()}
                    </td>
                    <td>{(p.totalActual || 0).toLocaleString()}</td>
                    <td style={{color: balance > 0 ? 'var(--color-warning)' : 'var(--color-success)', fontWeight:500}}>
                      {balance > 0 ? `-${balance.toLocaleString()}` : `+${Math.abs(balance).toLocaleString()}`}
                    </td>
                    <td>
                      <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                        <div style={{width:'60px', height:'6px', backgroundColor:'var(--border-light)', borderRadius:'999px'}}>
                          <div style={{width:`${Math.min(sl, 100)}%`, height:'100%', backgroundColor: slColor, borderRadius:'999px'}}/>
                        </div>
                        <span style={{color: slColor, fontWeight:700, fontSize:'0.85rem'}}>{sl}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Plan Modal */}
      {isModalOpen && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div className="card" style={{width:'640px',padding:'2.5rem',maxHeight:'90vh',overflowY:'auto'}}>
            <h2 className="card-title" style={{borderBottom:'1px solid var(--border-light)',paddingBottom:'1rem',marginBottom:'1.5rem'}}>
              Add MPS Entry — {MONTHS[month-1]} {year}
            </h2>

            <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
              <div className="input-group">
                <label className="input-label">SEARCH PRODUCT (842 SKUs)</label>
                <input className="input-field" list="sku-master" placeholder="Type SKU code or product name..."
                  onChange={e => handleProductSelect(e.target.value)} />
                <datalist id="sku-master">
                  {products.map(p => <option key={p.id} value={`${p.skuCode} - ${p.nameEn}`} />)}
                </datalist>
              </div>

              {selectedProduct && (
                <div style={{padding:'1rem',backgroundColor:'var(--bg-main)',borderRadius:'var(--radius-md)',border:'1px solid var(--border-light)',fontSize:'0.85rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem'}}>
                  <div><strong>Brand:</strong> {selectedProduct.brand || '—'}</div>
                  <div><strong>Family:</strong> {selectedProduct.family || '—'}</div>
                  <div><strong>Ingredient Ratio:</strong> {selectedProduct.ingredientRatio} KG/unit</div>
                  <div><strong>Compatible Lines:</strong> {selectedProduct.compatibleLines?.join(', ') || 'Any'}</div>
                </div>
              )}

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">FILLING MACHINE</label>
                  <input className="input-field" list="machine-list" value={machineName} placeholder="e.g. kalix"
                    onChange={e => setMachineName(e.target.value)} />
                  <datalist id="machine-list">
                    {masterData.machines.map(m => <option key={m} value={m} />)}
                  </datalist>
                </div>
                <div className="input-group">
                  <label className="input-label">TARGET QTY (PCS)</label>
                  <input className="input-field" type="number" placeholder="e.g. 40000"
                    onChange={e => setTargetQty(Number(e.target.value))} />
                </div>
              </div>

              {selectedProduct && targetQty > 0 && (
                <div style={{padding:'1rem',borderRadius:'var(--radius-md)',border:'2px solid var(--color-primary)',backgroundColor:'rgba(79,70,229,0.05)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>AUTO-CALCULATED BULK REQUIRED</div>
                      <div style={{fontSize:'2rem',fontWeight:800,color:'var(--color-primary)'}}>
                        {(() => {
                          const ratio = (selectedProduct.ingredientRatio && selectedProduct.ingredientRatio > 0)
                            ? selectedProduct.ingredientRatio
                            : (selectedProduct.template?.ingredientRatio || 0);
                          return (targetQty * ratio).toFixed(1);
                        })()} KG
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>EST. RUNTIME</div>
                      <div style={{fontSize:'1.2rem',fontWeight:700,color:'var(--text-main)'}}>
                        {(() => {
                          const speed = (selectedProduct.idealSpeed && selectedProduct.idealSpeed > 0)
                            ? selectedProduct.idealSpeed
                            : (selectedProduct.template?.idealSpeed || 0);
                          return speed > 0 ? `${Math.ceil(targetQty / speed / 60)} hrs` : '—';
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions" style={{marginTop:'2rem'}}>
              <button className="btn btn-outline" onClick={() => { setModalOpen(false); setSelectedProduct(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddPlan} disabled={!selectedProduct || !targetQty}>
                Release to MPS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
