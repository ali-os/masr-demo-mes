'use client';
import { useEffect, useState } from 'react';

export default function DigitalTwin() {
  const [machines, setMachines] = useState<any[]>([]);
  const [status, setStatus] = useState('OFFLINE');

  useEffect(() => {
    const es = new EventSource('/api/telemetry');
    es.onopen = () => setStatus('LIVE');
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'HEARTBEAT' && data.machines) {
        setMachines(data.machines);
      }
    };
    es.onerror = () => { setStatus('OFFLINE'); es.close(); };
    return () => es.close();
  }, []);

  const stateColor = (state: string) => state === 'RUNNING' ? 'var(--color-success)' : state === 'IDLE' ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <div>
      <div className="card-header">
        <h1 className="card-title" style={{fontSize:'2.5rem', fontWeight:800}}>Digital Twin — Floor View</h1>
        <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
          <div className={`badge ${status==='LIVE'?'badge-running':'badge-stopped'}`}>
            <span style={{marginRight:'0.5rem'}}>●</span> {status}
          </div>
          <span className="role-tag role-admin">Engineering</span>
        </div>
      </div>

      {/* Floor Layout */}
      <div className="card" style={{position:'relative', minHeight:'400px', overflow:'hidden', backgroundColor:'var(--bg-main)'}}>
        <div className="card-header"><h2 className="card-title">Production Floor — Live Sensor Data</h2></div>
        
        {machines.length === 0 ? (
          <div style={{padding:'4rem',textAlign:'center',color:'var(--text-muted)'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🏭</div>
            <p>No machines detected. Go to <a href="/live-board" style={{color:'var(--color-primary)'}}>Live Board</a> and start the simulator.</p>
          </div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:`repeat(${Math.min(machines.length, 4)}, 1fr)`, gap:'1.5rem', padding:'1rem'}}>
            {machines.map((m, i) => (
              <div key={i} style={{
                border:`2px solid ${stateColor(m.state)}`,
                borderRadius:'16px', padding:'1.5rem', backgroundColor:'var(--card-bg)',
                position:'relative', overflow:'hidden'
              }}>
                {/* Animated glow for running machines */}
                {m.state === 'RUNNING' && (
                  <div style={{
                    position:'absolute', top:0, left:0, right:0, height:'3px',
                    background:`linear-gradient(90deg, transparent, ${stateColor(m.state)}, transparent)`,
                    animation:'shimmer 2s infinite'
                  }}></div>
                )}
                
                <div style={{textAlign:'center', marginBottom:'1rem'}}>
                  <div style={{fontSize:'2.5rem', marginBottom:'0.5rem'}}>
                    {m.state === 'RUNNING' ? '⚙️' : m.state === 'IDLE' ? '⏸️' : '🛑'}
                  </div>
                  <strong style={{fontSize:'1rem'}}>{m.name || m.id}</strong>
                  <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{m.line}</div>
                  <span className={`badge ${m.state === 'RUNNING' ? 'badge-running' : m.state === 'IDLE' ? 'badge-waiting' : 'badge-stopped'}`} style={{marginTop:'0.5rem'}}>
                    {m.state}
                  </span>
                </div>

                {/* Station Flow */}
                <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'0.25rem', marginBottom:'1rem'}}>
                  {['Filler','Capper','Labeler','Packer'].map((station, j) => (
                    <div key={j} style={{display:'flex', alignItems:'center', gap:'0.25rem'}}>
                      <div style={{
                        width:'40px', height:'40px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center',
                        backgroundColor: m.state === 'RUNNING' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.1)',
                        border:`1px solid ${m.state === 'RUNNING' ? 'var(--color-success)' : 'var(--border-light)'}`,
                        fontSize:'0.55rem', fontWeight:600, color: m.state === 'RUNNING' ? 'var(--color-success)' : 'var(--text-muted)'
                      }}>
                        {station.substring(0,3)}
                      </div>
                      {j < 3 && <span style={{color:'var(--text-muted)', fontSize:'0.7rem'}}>→</span>}
                    </div>
                  ))}
                </div>

                {/* Live Metrics */}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem'}}>
                  <div style={{textAlign:'center', padding:'0.5rem', backgroundColor:'var(--bg-main)', borderRadius:'8px'}}>
                    <div style={{fontSize:'0.65rem', color:'var(--text-muted)'}}>Speed</div>
                    <div style={{fontSize:'1.2rem', fontWeight:700, color:'var(--color-primary)'}}>{m.speed || 0}</div>
                    <div style={{fontSize:'0.6rem', color:'var(--text-muted)'}}>BPM</div>
                  </div>
                  <div style={{textAlign:'center', padding:'0.5rem', backgroundColor:'var(--bg-main)', borderRadius:'8px'}}>
                    <div style={{fontSize:'0.65rem', color:'var(--text-muted)'}}>Count</div>
                    <div style={{fontSize:'1.2rem', fontWeight:700, color:'var(--color-success)'}}>{(m.todayTotal || 0).toLocaleString()}</div>
                    <div style={{fontSize:'0.6rem', color:'var(--text-muted)'}}>today</div>
                  </div>
                </div>

                {/* Sensor count */}
                <div style={{fontSize:'0.7rem', color:'var(--text-muted)', textAlign:'center', marginTop:'0.5rem'}}>
                  {m.sensorCount || 0} sensors | Last: {m.lastUpdate ? new Date(m.lastUpdate).toLocaleTimeString() : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><h2 className="card-title">Sensor Architecture</h2></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem'}}>
          {[
            {icon:'📡', type:'COUNTER', desc:'Photoelectric sensor — counts products passing between stations'},
            {icon:'⏱️', type:'SPEED', desc:'Measures current line speed in BPM (bottles per minute)'},
            {icon:'🔴', type:'REJECT', desc:'Reject sensor — counts defective items diverted from the line'},
            {icon:'🌡️', type:'TEMPERATURE', desc:'Monitors ambient or process temperature'}
          ].map((s, i) => (
            <div key={i} style={{padding:'1rem', borderRadius:'var(--radius-md)', border:'1px solid var(--border-light)', textAlign:'center'}}>
              <div style={{fontSize:'1.5rem', marginBottom:'0.5rem'}}>{s.icon}</div>
              <div style={{fontWeight:700, fontSize:'0.85rem', marginBottom:'0.25rem'}}>{s.type}</div>
              <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
