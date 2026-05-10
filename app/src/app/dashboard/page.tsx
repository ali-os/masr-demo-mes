'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(d => setStats(d.data || d))
      .catch(err => console.error(err));
  }, []);

  if (!stats) return <div style={{padding:'4rem', textAlign:'center', fontSize:'1.2rem', color:'var(--text-muted)'}}>
    <div className="shimmer" style={{width:'200px', height:'2rem', margin:'0 auto 1rem'}}></div>
    Loading live plant data...
  </div>;

  const slColor = (stats.production?.sl || 0) >= 95 ? 'var(--color-success)' : (stats.production?.sl || 0) >= 80 ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <div>
      <div className="card-header">
        <div>
          <h1 style={{fontSize:'2.5rem',fontWeight:800,letterSpacing:'-0.03em'}}>Plant Overview</h1>
          <p style={{color:'var(--text-muted)', fontSize:'0.9rem', marginTop:'0.25rem'}}>
            Live data from PostgreSQL — {stats.period?.month}/{stats.period?.year}
          </p>
        </div>
        <div style={{display:'flex', gap:'0.75rem'}}>
          <span className="source-tag source-calculated">LIVE DATABASE</span>
          <Link href="/guide" className="btn btn-outline" style={{fontSize:'0.8rem'}}>📖 System Guide</Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-4">
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-primary)'}}>
          <div className="stat-title">Monthly MPS Target</div>
          <div className="stat-value" style={{color:'var(--color-primary)'}}>{(stats.mps?.total || 0).toLocaleString()}</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>{stats.mps?.activeSKUs || 0} active SKUs</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-success)'}}>
          <div className="stat-title">Total Production</div>
          <div className="stat-value" style={{color:'var(--color-success)'}}>{(stats.production?.total || 0).toLocaleString()}</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>Today: {(stats.production?.today || 0).toLocaleString()}</div>
        </div>
        <div className="card stat-card" style={{borderTop:`3px solid ${slColor}`}}>
          <div className="stat-title">Service Level (SL%)</div>
          <div className="stat-value" style={{color: slColor}}>{stats.production?.sl || 0}%</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>Plan achievement</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-warning)'}}>
          <div className="stat-title">OEE (Plant Wide)</div>
          <div className="stat-value" style={{color:'var(--color-warning)'}}>{stats.oee?.average || 0}%</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>{stats.oee?.records || 0} records this month</div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid-cols-4" style={{marginTop:'1.5rem'}}>
        <div className="card stat-card">
          <div className="stat-title">Quality Rate</div>
          <div className="stat-value" style={{color:'var(--color-success)'}}>{stats.quality?.rate || 100}%</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>{stats.quality?.rejects || 0} rejects</div>
        </div>
        <div className="card stat-card">
          <div className="stat-title">Bulk Required</div>
          <div className="stat-value text-gradient">{((stats.mps?.bulk || 0) / 1000).toFixed(1)}t</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>tonnes this month</div>
        </div>
        <div className="card stat-card">
          <div className="stat-title">Product Catalog</div>
          <div className="stat-value text-gradient">{stats.catalog?.totalSKUs || 0}</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>{stats.catalog?.templates || 0} DNA templates</div>
        </div>
        <div className="card stat-card">
          <div className="stat-title">Data Source</div>
          <div className="stat-value" style={{fontSize:'1.5rem', color:'var(--color-success)'}}>PostgreSQL</div>
          <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--text-muted)'}}>All values are live</div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Quick Actions</h2></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1rem'}}>
          {[
            {href:'/planning', icon:'📅', label:'MPS Planning', desc:'Create monthly targets'},
            {href:'/production', icon:'✏️', label:'Shift Entry', desc:'Enter daily production'},
            {href:'/production/oee', icon:'⏱️', label:'OEE & Losses', desc:'Log machine downtime'},
            {href:'/production/summary', icon:'📊', label:'Summary Report', desc:'Plan vs Actual'},
            {href:'/settings/templates', icon:'🧬', label:'DNA Templates', desc:'Manage blueprints'},
            {href:'/settings/products', icon:'📦', label:'Product Master', desc:`${stats.catalog?.totalSKUs} SKUs`},
            {href:'/stores', icon:'✔️', label:'Stores', desc:'Material readiness'},
            {href:'/guide', icon:'📖', label:'System Guide', desc:'Full workflow'},
          ].map((a, i) => (
            <Link key={i} href={a.href} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem',
              padding:'1.25rem', borderRadius:'12px', border:'1px solid var(--border-light)',
              textDecoration:'none', color:'var(--text-main)', transition:'all 0.2s',
              backgroundColor:'var(--bg-surface)'
            }}>
              <span style={{fontSize:'1.5rem'}}>{a.icon}</span>
              <span style={{fontWeight:600, fontSize:'0.85rem'}}>{a.label}</span>
              <span style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>{a.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
