'use client';
import { useState, useEffect } from 'react';

export default function FinishedGoods() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [year] = useState(new Date().getFullYear());
  const [month] = useState(new Date().getMonth() + 1);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/finished-goods?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => { setData(d.data || d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year, month]);

  const summary = data?.summary || {};
  const byProduct = data?.byProduct || [];
  const recent = data?.recent || [];

  return (
    <div>
      <div className="card-header">
        <div>
          <h1 className="card-title" style={{fontSize:'2rem'}}>Finished Goods Receipt</h1>
          <p style={{color:'var(--text-muted)', fontSize:'0.9rem', marginTop:'0.25rem'}}>
            {MONTHS[month-1]} {year} — Net good output from production
          </p>
        </div>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span className="role-tag role-stores">FG Stores</span>
          <span className="role-tag role-quality">Quality</span>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-4">
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-success)'}}>
          <div className="stat-title">Received Today</div>
          <div className="stat-value" style={{color:'var(--color-success)'}}>{(summary.todayTotal || 0).toLocaleString()}</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>pieces from shifts</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-primary)'}}>
          <div className="stat-title">Grand Total (Month)</div>
          <div className="stat-value" style={{color:'var(--color-primary)'}}>{(summary.grandTotal || 0).toLocaleString()}</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>net good pieces</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-warning)'}}>
          <div className="stat-title">Rework / Pending</div>
          <div className="stat-value" style={{color:'var(--color-warning)'}}>{(summary.pendingReceipt || 0).toLocaleString()}</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>needs re-inspection</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid #8B5CF6'}}>
          <div className="stat-title">Products Received</div>
          <div className="stat-value text-gradient">{summary.productCount || 0}</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>unique SKUs</div>
        </div>
      </div>

      {/* FG by Product */}
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Finished Goods by Product</h2><span style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>{byProduct.length} SKUs</span></div>
        <div className="table-container" style={{maxHeight:'400px', overflowY:'auto'}}>
          <table>
            <thead>
              <tr><th>SKU</th><th>Product</th><th>Brand</th><th>Total Produced</th><th>Rework</th><th>Net Good</th><th>Shifts</th><th>Last Entry</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{textAlign:'center', padding:'3rem', color:'var(--text-muted)'}}>Loading...</td></tr>
              ) : byProduct.length === 0 ? (
                <tr><td colSpan={8} style={{textAlign:'center', padding:'3rem', color:'var(--text-muted)'}}>No production data. Enter daily shift production first.</td></tr>
              ) : byProduct.map((p: any, i: number) => (
                <tr key={i}>
                  <td style={{fontFamily:'monospace', fontSize:'0.8rem'}}>{p.sku}</td>
                  <td style={{fontSize:'0.85rem'}}>{p.nameEn}</td>
                  <td style={{fontSize:'0.85rem'}}>{p.brand}</td>
                  <td style={{fontWeight:600}}>{p.totalProduced.toLocaleString()}</td>
                  <td style={{color: p.totalRework > 0 ? 'var(--color-danger)' : 'var(--text-muted)'}}>{p.totalRework.toLocaleString()}</td>
                  <td style={{fontWeight:700, color:'var(--color-success)'}}>{p.netGood.toLocaleString()}</td>
                  <td style={{color:'var(--text-muted)'}}>{p.shiftCount}</td>
                  <td style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{new Date(p.lastDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Receipts */}
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Recent Shift Entries</h2></div>
        <div className="table-container">
          <table>
            <thead><tr><th>Date</th><th>Shift</th><th>SKU</th><th>Product</th><th>Produced</th><th>Rework</th><th>Net Good</th></tr></thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={7} style={{textAlign:'center', padding:'2rem', color:'var(--text-muted)'}}>No entries yet</td></tr>
              ) : recent.map((r: any, i: number) => (
                <tr key={i}>
                  <td style={{fontSize:'0.8rem'}}>{new Date(r.date).toLocaleDateString()}</td>
                  <td>S{r.shift}</td>
                  <td style={{fontFamily:'monospace', fontSize:'0.8rem'}}>{r.sku}</td>
                  <td style={{fontSize:'0.85rem'}}>{r.nameEn}</td>
                  <td style={{fontWeight:600}}>{r.qty.toLocaleString()}</td>
                  <td style={{color: r.rework > 0 ? 'var(--color-danger)' : 'var(--text-muted)'}}>{r.rework}</td>
                  <td style={{fontWeight:600, color:'var(--color-success)'}}>{r.net.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
