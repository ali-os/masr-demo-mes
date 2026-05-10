'use client';
import { useState, useEffect } from 'react';
import masterData from '@/lib/master-data.json';

export default function OEETracking() {
  const [machines, setMachines] = useState<any[]>([]);
  const [oeeRecords, setOeeRecords] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState(1);
  const [loading, setLoading] = useState(false);

  // OEE Entry State
  const [entry, setEntry] = useState({
    plannedTimeMins: 480,
    adjustMins: 0,
    mechFailMins: 0,
    minorStopMins: 0,
    changeoverMins: 0,
    qualityLossMins: 0,
    utilityMins: 0,
    waitMins: 0,
    manageMins: 0,
    outputQty: 0,
    rejectQty: 0,
    notes: ''
  });

  useEffect(() => {
    fetch('/api/machines').then(r => r.json()).then(d => {
      const data = Array.isArray(d.data) ? d.data : [];
      setMachines(data);
      if (data.length > 0) setSelectedMachine(data[0].id);
    });
  }, []);

  const handleSave = async () => {
    if (!selectedMachine) return;
    setLoading(true);
    const res = await fetch('/api/oee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machineId: selectedMachine,
        date,
        shift,
        ...entry
      })
    });
    if (res.ok) {
      alert('OEE Record Saved Successfully');
    }
    setLoading(false);
  };

  // Calculate real-time KPIs
  const totalDowntime = entry.adjustMins + entry.mechFailMins + entry.minorStopMins + entry.changeoverMins + entry.utilityMins + entry.waitMins + entry.manageMins;
  const runtime = entry.plannedTimeMins - totalDowntime;
  const availability = entry.plannedTimeMins > 0 ? (runtime / entry.plannedTimeMins * 100) : 0;
  // Simplified performance (would normally need ideal speed * runtime)
  const performance = 92; 
  const quality = (entry.outputQty + entry.rejectQty) > 0 ? (entry.outputQty / (entry.outputQty + entry.rejectQty) * 100) : 100;
  const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

  return (
    <div>
      <div className="card-header">
        <div>
          <h1 className="card-title" style={{fontSize:'2rem'}}>OEE & Loss Tracking</h1>
          <p style={{color:'var(--text-muted)', fontSize:'0.9rem', marginTop:'0.25rem'}}>
            Log downtime events and quality losses per machine shift
          </p>
        </div>
        <div style={{display:'flex', gap:'1rem'}}>
          <button className="btn btn-outline">📥 Import OEE Excel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : '💾 Save Record'}
          </button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'300px 1fr', gap:'1.5rem'}}>
        {/* Sidebar Controls */}
        <div className="card">
          <h2 className="card-title" style={{fontSize:'1.1rem', marginBottom:'1.5rem'}}>Selection</h2>
          <div style={{display:'flex', flexDirection:'column', gap:'1.2rem'}}>
            <div className="input-group">
              <label className="input-label">MACHINE / LINE</label>
              <select className="input-field" value={selectedMachine} onChange={e => setSelectedMachine(e.target.value)}>
                {masterData.machines.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">DATE</label>
              <input className="input-field" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">SHIFT</label>
              <div style={{display:'flex', gap:'0.5rem'}}>
                {[1, 2].map(s => (
                  <button key={s} 
                    className={`btn ${shift === s ? 'btn-primary' : 'btn-outline'}`}
                    style={{flex:1}}
                    onClick={() => setShift(s)}>
                    Shift {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{marginTop:'2rem', padding:'1rem', backgroundColor:'var(--bg-main)', borderRadius:'var(--radius-md)'}}>
            <div style={{fontSize:'0.75rem', fontWeight:600, color:'var(--text-muted)', marginBottom:'0.5rem'}}>SUMMARY</div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.5rem'}}>
              <span>Availability</span>
              <span style={{fontWeight:700}}>{availability.toFixed(1)}%</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.5rem'}}>
              <span>Performance</span>
              <span style={{fontWeight:700}}>{performance}%</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1rem'}}>
              <span>Quality</span>
              <span style={{fontWeight:700}}>{quality.toFixed(1)}%</span>
            </div>
            <div style={{textAlign:'center', padding:'1rem', borderTop:'1px solid var(--border-light)'}}>
              <div style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>OEE SCORE</div>
              <div style={{fontSize:'2.5rem', fontWeight:900, color:'var(--color-primary)'}}>{oee.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Loss Entry Form */}
        <div className="card">
          <h2 className="card-title" style={{fontSize:'1.1rem', marginBottom:'1.5rem'}}>Loss Category Entry (Minutes)</h2>
          
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1.5rem'}}>
            <div className="input-group">
              <label className="input-label">ADJ (Setup/Adjustment)</label>
              <input className="input-field" type="number" value={entry.adjustMins} 
                onChange={e => setEntry({...entry, adjustMins: Number(e.target.value)})} />
              <p style={{fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.2rem'}}>Excel: ADJ1-ADJ18</p>
            </div>
            <div className="input-group">
              <label className="input-label">MF (Mechanical Failure)</label>
              <input className="input-field" type="number" value={entry.mechFailMins} 
                onChange={e => setEntry({...entry, mechFailMins: Number(e.target.value)})} />
              <p style={{fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.2rem'}}>Excel: MF1-MF16</p>
            </div>
            <div className="input-group">
              <label className="input-label">MIN (Minor Stops)</label>
              <input className="input-field" type="number" value={entry.minorStopMins} 
                onChange={e => setEntry({...entry, minorStopMins: Number(e.target.value)})} />
              <p style={{fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.2rem'}}>Excel: MIN1-MIN4</p>
            </div>
            <div className="input-group">
              <label className="input-label">Changeover Time</label>
              <input className="input-field" type="number" value={entry.changeoverMins} 
                onChange={e => setEntry({...entry, changeoverMins: Number(e.target.value)})} />
            </div>
            <div className="input-group">
              <label className="input-label">UT (Utility/Power)</label>
              <input className="input-field" type="number" value={entry.utilityMins} 
                onChange={e => setEntry({...entry, utilityMins: Number(e.target.value)})} />
            </div>
            <div className="input-group">
              <label className="input-label">WH (Warehouse Wait)</label>
              <input className="input-field" type="number" value={entry.waitMins} 
                onChange={e => setEntry({...entry, waitMins: Number(e.target.value)})} />
            </div>
          </div>

          <hr style={{margin:'2rem 0', border:'none', borderTop:'1px solid var(--border-light)'}} />

          <h2 className="card-title" style={{fontSize:'1.1rem', marginBottom:'1.5rem'}}>Production Output</h2>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1.5rem'}}>
            <div className="input-group">
              <label className="input-label">GOOD OUTPUT (PCS)</label>
              <input className="input-field" type="number" value={entry.outputQty} 
                onChange={e => setEntry({...entry, outputQty: Number(e.target.value)})} />
            </div>
            <div className="input-group">
              <label className="input-label">REJECT QTY (PCS)</label>
              <input className="input-field" type="number" value={entry.rejectQty} 
                onChange={e => setEntry({...entry, rejectQty: Number(e.target.value)})} />
            </div>
            <div className="input-group">
              <label className="input-label">PLANNED TIME (MIN)</label>
              <input className="input-field" type="number" value={entry.plannedTimeMins} 
                onChange={e => setEntry({...entry, plannedTimeMins: Number(e.target.value)})} />
            </div>
          </div>

          <div className="input-group" style={{marginTop:'1.5rem'}}>
            <label className="input-label">NOTES / COMMENTS</label>
            <textarea className="input-field" style={{minHeight:'80px', paddingTop:'0.5rem'}}
              value={entry.notes} onChange={e => setEntry({...entry, notes: e.target.value})} />
          </div>
        </div>
      </div>
    </div>
  );
}
