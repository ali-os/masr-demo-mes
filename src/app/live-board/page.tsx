'use client';
import { useState, useEffect, useRef } from 'react';

export default function LiveBoard() {
  const [machines, setMachines] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [simStatus, setSimStatus] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Connect to SSE
  useEffect(() => {
    const es = new EventSource('/api/telemetry');
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'HEARTBEAT' && data.machines) {
        setMachines(data.machines);
      }
    };
    es.onerror = () => setConnected(false);

    // Check simulator status
    fetch('/api/telemetry/simulator').then(r => r.json()).then(d => setSimStatus(d.data || d));

    return () => { es.close(); };
  }, []);

  const toggleSimulator = async (action: string) => {
    setSimLoading(true);
    const res = await fetch('/api/telemetry/simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    const data = await res.json();
    setSimStatus(data.data || data);
    setSimLoading(false);
    // Refresh status
    setTimeout(async () => {
      const s = await fetch('/api/telemetry/simulator').then(r => r.json());
      setSimStatus(s.data || s);
    }, 2000);
  };

  const totalCount = machines.reduce((s, m) => s + (m.todayTotal || 0), 0);
  const avgSpeed = machines.filter(m => m.speed > 0).length > 0
    ? Math.round(machines.filter(m => m.speed > 0).reduce((s, m) => s + m.speed, 0) / machines.filter(m => m.speed > 0).length)
    : 0;
  const runningCount = machines.filter(m => m.state === 'RUNNING').length;

  return (
    <div>
      <div className="card-header">
        <div>
          <h1 className="card-title" style={{fontSize:'2rem'}}>Live Production Board</h1>
          <p style={{color:'var(--text-muted)', fontSize:'0.85rem', marginTop:'0.25rem'}}>
            Real-time sensor data — SSE stream every 5s
          </p>
        </div>
        <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
          <span style={{fontSize:'0.8rem',color: connected ? 'var(--color-success)' : 'var(--color-danger)'}}>
            ● {connected ? 'SSE Connected' : 'Disconnected'}
          </span>
          <span className="source-tag source-calculated">LIVE TELEMETRY</span>
        </div>
      </div>

      {/* Simulator Control */}
      <div className="card" style={{marginBottom:'1.5rem', borderTop:'3px solid #8B5CF6'}}>
        <div className="card-header">
          <h2 className="card-title">🎛️ Production Line Simulator</h2>
          <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
            <span style={{fontSize:'0.85rem', color: simStatus?.running ? 'var(--color-success)' : 'var(--text-muted)', fontWeight:600}}>
              {simStatus?.running ? '● RUNNING' : '○ STOPPED'}
            </span>
            {simStatus?.running ? (
              <button className="btn btn-outline" style={{fontSize:'0.8rem',borderColor:'var(--color-danger)',color:'var(--color-danger)'}} 
                onClick={() => toggleSimulator('stop')} disabled={simLoading}>
                {simLoading ? 'Stopping...' : '⏹ Stop Simulator'}
              </button>
            ) : (
              <button className="btn btn-primary" style={{fontSize:'0.8rem'}} 
                onClick={() => toggleSimulator('start')} disabled={simLoading}>
                {simLoading ? 'Starting...' : '▶ Start Simulator'}
              </button>
            )}
          </div>
        </div>
        {simStatus?.running && (
          <div style={{display:'flex',gap:'2rem',fontSize:'0.85rem',color:'var(--text-muted)'}}>
            <span>Ticks: <strong>{simStatus?.stats?.ticks || 0}</strong></span>
            <span>Events: <strong>{simStatus?.stats?.eventsGenerated || 0}</strong></span>
            <span>Sensors: <strong>{simStatus?.sensors || 0}</strong></span>
            <span>Since: <strong>{simStatus?.stats?.startedAt ? new Date(simStatus.stats.startedAt).toLocaleTimeString() : '—'}</strong></span>
          </div>
        )}
        {!simStatus?.running && (
          <p style={{fontSize:'0.85rem',color:'var(--text-muted)',margin:0}}>
            Click "Start Simulator" to generate realistic sensor data. Counters at each station will increment every 5 seconds, 
            simulating photoelectric sensors counting products between Filler → Capper → Labeler → Packer.
          </p>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-4">
        <div className="card stat-card" style={{textAlign:'center',borderTop:'3px solid var(--color-success)'}}>
          <div className="stat-title">Good Count (Today)</div>
          <div className="stat-value" style={{color:'var(--color-success)',fontSize:'3rem'}}>{totalCount.toLocaleString()}</div>
          <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{machines.length} machines tracked</div>
        </div>
        <div className="card stat-card" style={{textAlign:'center',borderTop:'3px solid var(--color-primary)'}}>
          <div className="stat-title">Avg Speed</div>
          <div className="stat-value" style={{color:'var(--color-primary)',fontSize:'3rem'}}>{avgSpeed}</div>
          <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>BPM (bottles/min)</div>
        </div>
        <div className="card stat-card" style={{textAlign:'center',borderTop:'3px solid var(--color-success)'}}>
          <div className="stat-title">Running</div>
          <div className="stat-value" style={{color:'var(--color-success)',fontSize:'3rem'}}>{runningCount} / {machines.length}</div>
          <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>machines active</div>
        </div>
        <div className="card stat-card" style={{textAlign:'center',borderTop:'3px solid var(--color-danger)'}}>
          <div className="stat-title">Rejects</div>
          <div className="stat-value" style={{color:'var(--color-danger)',fontSize:'3rem'}}>{machines.reduce((s, m) => s + (m.rejects || 0), 0)}</div>
          <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>last reading</div>
        </div>
      </div>

      {/* Machine Cards */}
      <div className="grid-cols-2" style={{gridTemplateColumns:'repeat(auto-fill, minmax(350px, 1fr))', marginTop:'1.5rem'}}>
        {machines.length === 0 ? (
          <div className="card" style={{padding:'3rem',textAlign:'center',color:'var(--text-muted)',gridColumn:'1/-1'}}>
            {connected ? 'No machines registered. Start the simulator or register machines in Admin Config.' : 'Connecting to telemetry stream...'}
          </div>
        ) : machines.map((m, i) => {
          const stateColor = m.state === 'RUNNING' ? 'var(--color-success)' : m.state === 'IDLE' ? 'var(--color-warning)' : 'var(--color-danger)';
          return (
            <div className="card" key={i} style={{borderLeft:`4px solid ${stateColor}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
                <div>
                  <strong style={{fontSize:'1.1rem'}}>{m.name || m.id}</strong>
                  <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{m.line || '—'} | {m.sensorCount || 0} sensors</div>
                </div>
                <span className={`badge ${m.state === 'RUNNING' ? 'badge-running' : m.state === 'IDLE' ? 'badge-waiting' : 'badge-stopped'}`}>
                  {m.state}
                </span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',marginBottom:'0.75rem'}}>
                <div>
                  <div style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>Speed</div>
                  <div style={{fontSize:'1.5rem',fontWeight:700,color:'var(--color-primary)'}}>{m.speed || 0}</div>
                  <div style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>BPM</div>
                </div>
                <div>
                  <div style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>Today Count</div>
                  <div style={{fontSize:'1.5rem',fontWeight:700,color:'var(--color-success)'}}>{(m.todayTotal || 0).toLocaleString()}</div>
                  <div style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>pieces</div>
                </div>
                <div>
                  <div style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>Last Batch</div>
                  <div style={{fontSize:'1.5rem',fontWeight:700,color: m.rejects > 0 ? 'var(--color-danger)' : 'var(--text-muted)'}}>+{m.lastCount || 0}</div>
                  <div style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>last 60s</div>
                </div>
              </div>
              {m.lastUpdate && (
                <div style={{fontSize:'0.7rem',color:'var(--text-muted)',borderTop:'1px solid var(--border-light)',paddingTop:'0.5rem'}}>
                  Last update: {new Date(m.lastUpdate).toLocaleTimeString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
