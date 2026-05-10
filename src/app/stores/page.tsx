'use client';
import { useState, useEffect } from 'react';

export default function Stores() {
  const [readiness, setReadiness] = useState<any[]>([]);
  
  useEffect(() => {
    fetch('/api/stores/readiness')
      .then(res => res.json())
      .then(d => setReadiness(Array.isArray(d.data) ? d.data : []));
  }, []);

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>Stores & Material Readiness</h1>
        <div style={{display:'flex', gap:'0.5rem'}}>
          <span className="role-tag role-stores">Stores</span>
          <span className="source-tag source-calculated">CALCULATED</span>
        </div>
      </div>

      <div className="card" style={{marginBottom:'1.5rem'}}>
        <div className="card-header">
          <h2 className="card-title">Material Shortage Alerts (Next 7 Days)</h2>
          <span className="badge badge-stopped" style={{backgroundColor:'#ef4444'}}>CRITICAL SHORTAGE</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SKU Code</th><th>Description</th><th>Line</th><th>Target Qty</th><th>Bulk Needed</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {readiness.map((item, i) => (
                <tr key={i} style={{backgroundColor: item.status === 'SHORTAGE' ? 'rgba(239,68,68,0.05)' : ''}}>
                  <td>{item.sku}</td><td>{item.description}</td>
                  <td><span className="badge badge-running">{item.line}</span></td>
                  <td style={{fontWeight:600}}>{item.target.toLocaleString()} pcs</td>
                  <td style={{color: 'var(--color-primary)', fontWeight:700}}>{item.bulkNeeded} KG</td>
                  <td>
                    {item.status === 'SHORTAGE' ? (
                      <span className="badge badge-stopped">Shortage</span>
                    ) : (
                      <span className="badge badge-running">Ready</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-cols-2">
        <div className="card">
          <div className="card-header"><h2 className="card-title">Recent Stock Moves (GRN)</h2></div>
          <div className="table-container">
            <table>
              <thead><tr><th>Date</th><th>PO#</th><th>Supplier</th><th>Qty</th></tr></thead>
              <tbody>
                <tr><td>Mar 5</td><td>PO-9923</td><td>BASF Germany</td><td>5,000 kg</td></tr>
                <tr><td>Mar 4</td><td>PO-9912</td><td>Local Plastics</td><td>20,000 pcs</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h2 className="card-title">Inventory Health</h2></div>
          <div style={{textAlign:'center', padding:'2rem'}}>
            <div style={{fontSize:'3rem', fontWeight:800, color:'#10b981'}}>92%</div>
            <p style={{color:'var(--text-muted)'}}>Plan Readiness Score</p>
            <div style={{fontSize:'0.75rem', marginTop:'1rem'}}>Total Materials: 84 | Shortages: 3</div>
          </div>
        </div>
      </div>
    </div>
  );
}
