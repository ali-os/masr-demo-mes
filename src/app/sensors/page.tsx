'use client';
import { useState, useEffect } from 'react';

export default function Sensors() {
  const [sensors, setSensors] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [simStatus, setSimStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newSensor, setNewSensor] = useState({ sensorCode: '', type: 'COUNTER', machineId: '' });

  const SENSOR_TYPES = ['COUNTER', 'SPEED', 'REJECT', 'TEMPERATURE'];

  const loadData = async () => {
    setLoading(true);
    const [s, m, e, sim] = await Promise.all([
      fetch('/api/telemetry/sensors').then(r => r.json()),
      fetch('/api/machines').then(r => r.json()),
      fetch('/api/telemetry/ingest?limit=20').then(r => r.json()),
      fetch('/api/telemetry/simulator').then(r => r.json()),
    ]);
    setSensors(Array.isArray(s.data) ? s.data : []);
    setMachines(Array.isArray(m.data) ? m.data : Array.isArray(m) ? m : []);
    setEvents(Array.isArray(e.data) ? e.data : []);
    setSimStatus(sim.data || sim);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleAddSensor = async () => {
    if (!newSensor.sensorCode || !newSensor.machineId) return;
    await fetch('/api/telemetry/sensors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSensor)
    });
    setNewSensor({ sensorCode: '', type: 'COUNTER', machineId: '' });
    setShowForm(false);
    loadData();
  };

  const handleSimAction = async (action: string) => {
    await fetch('/api/telemetry/simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    setTimeout(loadData, 2000);
  };

  return (
    <div>
      <div className="card-header">
        <div>
          <h1 className="card-title" style={{fontSize:'2rem'}}>Sensor Registry & Telemetry</h1>
          <p style={{color:'var(--text-muted)', fontSize:'0.85rem', marginTop:'0.25rem'}}>
            Manage sensors, monitor events, and control the production simulator
          </p>
        </div>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <span className="role-tag role-admin">Engineering</span>
          <span className="source-tag source-calculated">LIVE</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-4">
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-primary)'}}>
          <div className="stat-title">Registered Sensors</div>
          <div className="stat-value text-gradient">{sensors.length}</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-success)'}}>
          <div className="stat-title">Machines</div>
          <div className="stat-value" style={{color:'var(--color-success)'}}>{machines.length}</div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid #8B5CF6'}}>
          <div className="stat-title">Simulator</div>
          <div className="stat-value" style={{color: simStatus?.running ? 'var(--color-success)' : 'var(--text-muted)', fontSize:'1.5rem'}}>
            {simStatus?.running ? '● RUNNING' : '○ STOPPED'}
          </div>
        </div>
        <div className="card stat-card" style={{borderTop:'3px solid var(--color-warning)'}}>
          <div className="stat-title">Recent Events</div>
          <div className="stat-value" style={{color:'var(--color-warning)'}}>{events.length}</div>
        </div>
      </div>

      {/* Simulator Control */}
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header">
          <h2 className="card-title">🎛️ Simulator Control</h2>
          <div style={{display:'flex',gap:'0.5rem'}}>
            {simStatus?.running ? (
              <button className="btn btn-outline" style={{borderColor:'var(--color-danger)',color:'var(--color-danger)'}} onClick={() => handleSimAction('stop')}>⏹ Stop</button>
            ) : (
              <button className="btn btn-primary" onClick={() => handleSimAction('start')}>▶ Start Simulator</button>
            )}
          </div>
        </div>
        <p style={{fontSize:'0.85rem',color:'var(--text-muted)',margin:0}}>
          The simulator auto-registers COUNTER, SPEED, and REJECT sensors for each machine, then generates realistic production data every 5 seconds. 
          Sensor events are saved to the database and streamed via SSE to the Live Board and Digital Twin.
        </p>
      </div>

      <div className="grid-cols-2" style={{marginTop:'1.5rem'}}>
        {/* Sensor Registry Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Registered Sensors</h2>
            <button className="btn btn-primary" style={{fontSize:'0.8rem'}} onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Add Sensor'}
            </button>
          </div>
          
          {showForm && (
            <div style={{padding:'1rem',backgroundColor:'var(--bg-main)',borderRadius:'var(--radius-md)',marginBottom:'1rem'}}>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">SENSOR CODE</label>
                  <input className="input-field" placeholder="SNS-F1-CTR-01" value={newSensor.sensorCode} 
                    onChange={e => setNewSensor({...newSensor, sensorCode: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">TYPE</label>
                  <select className="input-field" value={newSensor.type} onChange={e => setNewSensor({...newSensor, type: e.target.value})}>
                    {SENSOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">MACHINE</label>
                  <select className="input-field" value={newSensor.machineId} onChange={e => setNewSensor({...newSensor, machineId: e.target.value})}>
                    <option value="">Select...</option>
                    {machines.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.machineCode || m.code})</option>)}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" style={{marginTop:'0.5rem'}} onClick={handleAddSensor}>Register Sensor</button>
            </div>
          )}

          <div className="table-container" style={{maxHeight:'400px',overflowY:'auto'}}>
            <table>
              <thead><tr><th>Code</th><th>Type</th><th>Machine</th><th>Line</th><th>Last Event</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>Loading...</td></tr>
                ) : sensors.length === 0 ? (
                  <tr><td colSpan={5} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>No sensors. Click "Start Simulator" to auto-register.</td></tr>
                ) : sensors.map((s: any, i: number) => (
                  <tr key={i}>
                    <td style={{fontFamily:'monospace',fontSize:'0.8rem'}}>{s.sensorCode}</td>
                    <td><span className={`badge ${s.type === 'COUNTER' ? 'badge-running' : s.type === 'REJECT' ? 'badge-stopped' : 'badge-waiting'}`}>{s.type}</span></td>
                    <td style={{fontSize:'0.85rem'}}>{s.machine?.name || '—'}</td>
                    <td style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{s.machine?.line?.name || '—'}</td>
                    <td style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>
                      {s.sensorEvents?.[0] ? `${s.sensorEvents[0].value} @ ${new Date(s.sensorEvents[0].timestamp).toLocaleTimeString()}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Events */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Sensor Events</h2>
            <button className="btn btn-outline" style={{fontSize:'0.8rem'}} onClick={loadData}>🔄 Refresh</button>
          </div>
          <div className="table-container" style={{maxHeight:'400px',overflowY:'auto'}}>
            <table>
              <thead><tr><th>Time</th><th>Sensor</th><th>Value</th><th>Source</th></tr></thead>
              <tbody>
                {events.length === 0 ? (
                  <tr><td colSpan={4} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>No events yet</td></tr>
                ) : events.map((e: any, i: number) => (
                  <tr key={i}>
                    <td style={{fontSize:'0.75rem',whiteSpace:'nowrap'}}>{new Date(e.timestamp).toLocaleTimeString()}</td>
                    <td style={{fontFamily:'monospace',fontSize:'0.75rem'}}>{e.sensor?.sensorCode || e.sensorId}</td>
                    <td style={{fontWeight:600}}>{e.value}</td>
                    <td><span className={`source-tag ${e.sourceTag === 'SIMULATOR' ? 'source-calculated' : 'source-auto-plc'}`}>{e.sourceTag}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
