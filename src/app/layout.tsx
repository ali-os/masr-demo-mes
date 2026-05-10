import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'MES Operations Platform',
  description: 'Factory MES, OEE, Planning, Materials, Quality & Maintenance System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang: string = 'en';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="app-container">
          <aside className="sidebar">
            <div className="sidebar-header"><span>MES</span>&nbsp;Platform</div>
            <nav className="sidebar-nav">
              {/* ─── Overview ─── */}
              <div className="nav-group-label">Overview</div>
              <Link href="/dashboard"       className="nav-item"><span className="nav-icon">📊</span> Dashboard</Link>
              <Link href="/guide"           className="nav-item"><span className="nav-icon">📖</span> System Guide</Link>
              <Link href="/plant-overview"   className="nav-item"><span className="nav-icon">🏭</span> Plant Overview</Link>
              <Link href="/line-overview"    className="nav-item"><span className="nav-icon">📈</span> Line Overview</Link>
              <Link href="/live-board"       className="nav-item"><span className="nav-icon">📺</span> Live Board</Link>
              <Link href="/digital-twin"     className="nav-item"><span className="nav-icon">🧊</span> Digital Twin</Link>

              {/* ─── Planning ─── */}
              <div className="nav-group-label">Planning &amp; MPS</div>
              <Link href="/planning"         className="nav-item"><span className="nav-icon">📅</span> MPS Plan Board</Link>
              <Link href="/production"       className="nav-item"><span className="nav-icon">✏️</span> Weekly Entry (W1-3)</Link>
              <Link href="/production/summary" className="nav-item"><span className="nav-icon">📊</span> Production Summary</Link>
              <Link href="/work-orders"      className="nav-item"><span className="nav-icon">📋</span> Work Orders</Link>

              {/* ─── Production & OEE ─── */}
              <div className="nav-group-label">Production &amp; OEE</div>
              <Link href="/production/oee"   className="nav-item"><span className="nav-icon">⏱️</span> OEE &amp; Loss Entry</Link>
              <Link href="/operator"         className="nav-item"><span className="nav-icon">⚙️</span> Line Ops</Link>
              <Link href="/live-board"       className="nav-item"><span className="nav-icon">📺</span> Live Board</Link>
              <Link href="/digital-twin"     className="nav-item"><span className="nav-icon">🧊</span> Digital Twin</Link>

              {/* ─── Materials ─── */}
              <div className="nav-group-label">Materials &amp; BOM</div>
              <Link href="/settings/products" className="nav-item"><span className="nav-icon">🧬</span> Product DNA Master</Link>
              <Link href="/settings/templates" className="nav-item"><span className="nav-icon">📋</span> DNA Templates</Link>
              <Link href="/stores"           className="nav-item"><span className="nav-icon">📦</span> Stores &amp; Issue</Link>
              <Link href="/material-readiness" className="nav-item"><span className="nav-icon">✔️</span> Readiness</Link>

              {/* ─── Quality & Maintenance ─── */}
              <div className="nav-group-label">Quality &amp; Maintenance</div>
              <Link href="/quality"          className="nav-item"><span className="nav-icon">🔬</span> Quality</Link>
              <Link href="/maintenance"      className="nav-item"><span className="nav-icon">🔧</span> Maintenance</Link>
              <Link href="/machine-detail"   className="nav-item"><span className="nav-icon">🖥️</span> Machine Detail</Link>
              <Link href="/machine-timeline" className="nav-item"><span className="nav-icon">📊</span> Machine Timeline</Link>
              <Link href="/sensors"          className="nav-item"><span className="nav-icon">📡</span> Sensor Registry</Link>

              {/* ─── Analytics ─── */}
              <div className="nav-group-label">Analytics</div>
              <Link href="/analytics"        className="nav-item"><span className="nav-icon">📉</span> Historical</Link>
              <Link href="/oee-deep-dive"    className="nav-item"><span className="nav-icon">🔍</span> OEE Deep Dive</Link>
              <Link href="/loss-pareto"      className="nav-item"><span className="nav-icon">📊</span> Loss Pareto</Link>

              {/* ─── System ─── */}
              <div className="nav-group-label">System</div>
              <Link href="/alerts"           className="nav-item"><span className="nav-icon">🔔</span> Alert Center</Link>
              <Link href="/import"           className="nav-item"><span className="nav-icon">📁</span> Data Import</Link>
              <Link href="/audit"            className="nav-item"><span className="nav-icon">📜</span> Audit Viewer</Link>
              <Link href="/settings"         className="nav-item"><span className="nav-icon">⚙️</span> Admin Config</Link>
            </nav>
          </aside>

          <main className="main-content">
            <header className="topbar">
              <div style={{display:'flex',gap:'1rem',alignItems:'center'}}>
                <select className="input-field" style={{width:'auto',padding:'0.4rem 0.8rem',fontSize:'0.8rem'}}>
                  <option>All Lines</option><option>Line 1 – High Speed</option><option>Line 2</option><option>Line 3 – Specialty</option>
                </select>
                <select className="input-field" style={{width:'auto',padding:'0.4rem 0.8rem',fontSize:'0.8rem'}}>
                  <option>Shift A (06:00–14:00)</option><option>Shift B (14:00–22:00)</option><option>Shift C (22:00–06:00)</option>
                </select>
                <input type="date" className="input-field" defaultValue="2026-05-05" style={{width:'auto',padding:'0.4rem 0.8rem',fontSize:'0.8rem'}} />
                <span className="badge badge-running">Line 1 Running</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'1.5rem'}}>
                <Link href="/alerts" style={{color:'var(--text-muted)',textDecoration:'none',position:'relative'}}>
                  🔔 <span style={{position:'absolute',top:'-4px',right:'-8px',backgroundColor:'var(--color-danger)',color:'#fff',borderRadius:'50%',width:'18px',height:'18px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',fontWeight:700}}>3</span>
                </Link>
                <span style={{color:'var(--text-muted)',cursor:'pointer'}}>🌐 EN</span>
                <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'0.875rem',fontWeight:600}}>Ahmed Hassan</div>
                    <div style={{fontSize:'0.7rem',color:'var(--color-primary)'}}>Supervisor – Production</div>
                  </div>
                  <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'linear-gradient(135deg,var(--color-primary),#8B5CF6)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.875rem'}}>AH</div>
                </div>
              </div>
            </header>
            <div className="page-content">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
