'use client';
import { useState, useEffect } from 'react';

export default function Import() {
  const [role, setRole] = useState('ADMIN');
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Completed

  useEffect(() => {
    const handleStorage = () => setRole(localStorage.getItem('user-role') || 'ADMIN');
    handleStorage();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleStartImport = async () => {
    setIsImporting(true);
    // Simulate Excel Parsing API call
    setTimeout(() => {
      setStep(2);
      setIsImporting(false);
    }, 2000);
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    // Call the real /api/import/excel route we created
    try {
      const res = await fetch('/api/import/excel', { method: 'POST' });
      if (res.ok) {
        setStep(3);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2rem'}}>Data Import & Excel Parity</h1>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span className={`role-tag role-${role.toLowerCase()}`}>{role}</span>
        </div>
      </div>

      {step === 1 && (
        <div className="card">
          <div className="card-header"><h2 className="card-title">Upload Production Report (.xlsb)</h2></div>
          <div style={{border:'2px dashed var(--border-light)', padding:'3rem', textAlign:'center', borderRadius:'var(--radius-lg)'}}>
            <div style={{fontSize:'3rem', marginBottom:'1rem'}}>📊</div>
            <p style={{marginBottom:'1.5rem'}}>Upload 'Daily Prod Report Mar 2026.xlsb' to synchronize the database.</p>
            {(role === 'ADMIN' || role === 'PLANNER') ? (
              <button className="btn btn-primary" onClick={handleStartImport} disabled={isImporting}>
                {isImporting ? 'Parsing Excel...' : 'Upload & Start Parity Check'}
              </button>
            ) : (
              <p style={{color:'var(--color-danger)'}}>Permission Denied: Only Planners or Admins can import data.</p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <div className="card-header"><h2 className="card-title">Parity Preview — 8 Sheets Detected</h2></div>
          <div className="table-container">
            <table>
              <thead><tr><th>Sheet</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                <tr><td>Production 1</td><td><span className="badge badge-running">Ready</span></td><td>Sync 42 SKUs</td></tr>
                <tr><td>MPS Jan</td><td><span className="badge badge-running">Ready</span></td><td>Sync Monthly Plan</td></tr>
                <tr><td>Dash Board</td><td><span className="badge badge-running">Ready</span></td><td>Sync KPIs</td></tr>
              </tbody>
            </table>
          </div>
          <div className="form-actions" style={{marginTop:'1.5rem'}}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleConfirmImport} disabled={isImporting}>
              {isImporting ? 'Syncing DB...' : 'Confirm & Ingest to PostgreSQL'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card" style={{textAlign:'center', padding:'4rem'}}>
          <div style={{fontSize:'4rem', marginBottom:'1rem'}}>✅</div>
          <h2 style={{fontSize:'2rem', marginBottom:'1rem'}}>Import Successful</h2>
          <p style={{color:'var(--text-muted)', marginBottom:'2rem'}}>Database has been updated with values from the Excel report.</p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</button>
        </div>
      )}
    </div>
  )
}
