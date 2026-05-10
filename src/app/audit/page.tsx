'use client';
import { useState, useEffect } from 'react';

export default function Audit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/audit?limit=100').then(r=>r.json()).then(d => { setLogs(Array.isArray(d.data) ? d.data : []); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>Audit Viewer</h1>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span className="role-tag role-manager">Managers</span>
          <span className="role-tag role-admin">Admin</span>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>
      <div className="lock-banner">🔒 Audit records are immutable and read-only. They cannot be edited or deleted.</div>
      <div className="card">
        <div className="card-header"><h2 className="card-title">Audit Log</h2><span style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>{logs.length} records</span></div>
        <div className="table-container" style={{maxHeight:'600px',overflowY:'auto'}}>
          <table>
            <thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>Loading audit trail...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>No audit records yet. Actions are logged automatically as you use the system.</td></tr>
              ) : logs.map((l: any, i: number) => (
                <tr key={i}>
                  <td style={{fontSize:'0.8rem',whiteSpace:'nowrap'}}>{new Date(l.createdAt).toLocaleString()}</td>
                  <td style={{fontWeight:500}}>{l.user?.name || l.userId}</td>
                  <td><span className={`source-tag ${l.action.includes('ERROR')?'source-corrected':'source-manual'}`}>{l.action}</span></td>
                  <td>{l.entity}</td>
                  <td style={{fontSize:'0.75rem',maxWidth:'300px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--text-muted)'}}>
                    {typeof l.details === 'object' ? JSON.stringify(l.details).substring(0,100) : String(l.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
