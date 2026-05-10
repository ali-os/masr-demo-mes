'use client';
import { useState, useEffect } from 'react';

export default function Settings() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    fetch('/api/dashboard/stats').then(r=>r.json()).then(d => setStats(d.data || d));
  }, []);

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>System Configuration</h1>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span className="role-tag role-admin">Admin</span>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>

      <div className="grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">OEE Formula Manager</h2>
            <span className="source-tag source-calculated">ACTIVE</span>
          </div>
          <div className="form-section">
            <div className="input-group">
              <label className="input-label">Availability Formula</label>
              <input className="input-field" defaultValue="(Actual_Run_Time / Planned_Prod_Time) * 100" readOnly />
            </div>
            <div className="input-group">
              <label className="input-label">Performance Formula</label>
              <input className="input-field" defaultValue="((Ideal_Cycle_Time * Total_Count) / Actual_Run_Time) * 100" readOnly />
            </div>
            <div className="input-group">
              <label className="input-label">Quality Formula</label>
              <input className="input-field" defaultValue="(Good_Count / Total_Count) * 100" readOnly />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2 className="card-title">Master Data Management</h2></div>
          <div style={{display:'flex', flexDirection:'column', gap:'1rem', padding:'1rem 0'}}>
            <a href="/settings/products" className="btn btn-outline" style={{justifyContent:'space-between', width:'100%', textDecoration:'none'}}>
              <span>📦 Product Master (SKUs)</span>
              <span style={{color:'var(--color-primary)',fontWeight:700}}>{stats?.catalog?.totalSKUs || 0} products</span>
            </a>
            <a href="/settings/templates" className="btn btn-outline" style={{justifyContent:'space-between', width:'100%', textDecoration:'none'}}>
              <span>🧬 DNA Templates</span>
              <span style={{color:'var(--color-primary)',fontWeight:700}}>{stats?.catalog?.templates || 0} templates</span>
            </a>
            <a href="/planning" className="btn btn-outline" style={{justifyContent:'space-between', width:'100%', textDecoration:'none'}}>
              <span>📅 MPS Planning</span>
              <span style={{color:'var(--color-primary)',fontWeight:700}}>{stats?.mps?.activeSKUs || 0} active plans</span>
            </a>
            <a href="/import" className="btn btn-outline" style={{justifyContent:'space-between', width:'100%', textDecoration:'none'}}>
              <span>📁 Data Import</span>
              <span>→</span>
            </a>
            <a href="/audit" className="btn btn-outline" style={{justifyContent:'space-between', width:'100%', textDecoration:'none'}}>
              <span>📜 Audit Trail</span>
              <span>→</span>
            </a>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2 className="card-title">User Permissions & RBAC Matrix</h2></div>
          <div className="table-container">
            <table>
              <thead><tr><th>Action</th><th>Operator</th><th>Supervisor</th><th>Admin</th></tr></thead>
              <tbody>
                <tr><td>Enter Production</td><td>✅</td><td>✅</td><td>✅</td></tr>
                <tr><td>Log OEE & Losses</td><td>✅</td><td>✅</td><td>✅</td></tr>
                <tr><td>Log Quality Rejects</td><td>❌</td><td>✅</td><td>✅</td></tr>
                <tr><td>Create MPS Plans</td><td>❌</td><td>✅</td><td>✅</td></tr>
                <tr><td>Modify Products/SKUs</td><td>❌</td><td>❌</td><td>✅</td></tr>
                <tr><td>Manage Templates</td><td>❌</td><td>❌</td><td>✅</td></tr>
                <tr><td>Import Data</td><td>❌</td><td>❌</td><td>✅</td></tr>
                <tr><td>View Audit Trail</td><td>❌</td><td>✅</td><td>✅</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2 className="card-title">System Information</h2></div>
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.9rem'}}>
              <span style={{color:'var(--text-muted)'}}>Database</span><span style={{fontWeight:600}}>PostgreSQL</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.9rem'}}>
              <span style={{color:'var(--text-muted)'}}>Framework</span><span style={{fontWeight:600}}>Next.js + Prisma</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.9rem'}}>
              <span style={{color:'var(--text-muted)'}}>Total Pages</span><span style={{fontWeight:600}}>30+</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.9rem'}}>
              <span style={{color:'var(--text-muted)'}}>Data Status</span><span style={{fontWeight:600,color:'var(--color-success)'}}>100% LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
