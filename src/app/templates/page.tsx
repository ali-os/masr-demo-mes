'use client';
import { useState, useEffect } from 'react';

export default function Templates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    name: '',
    category: 'Liquid',
    description: '',
    idealSpeed: 60,
    targetOEE: 85,
    ingredientRatio: 1.0,
    setupTimeMins: 30,
    bomItems: []
  });

  const fetchTemplates = () => {
    setLoading(true);
    fetch('/api/templates')
      .then(r => r.json())
      .then(d => { setTemplates(Array.isArray(d.data) ? d.data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setFormData({
      name: t.name,
      category: t.category || 'Liquid',
      description: t.description || '',
      idealSpeed: t.idealSpeed,
      targetOEE: t.targetOEE,
      ingredientRatio: t.ingredientRatio,
      setupTimeMins: t.setupTimeMins,
      bomItems: t.templateBoms || []
    });
  };

  const handleSave = async () => {
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId ? { id: editingId, ...formData } : formData;

    const res = await fetch('/api/templates', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      setEditingId(null);
      fetchTemplates();
    }
  };

  const addBomItem = () => {
    setFormData({
      ...formData,
      bomItems: [...formData.bomItems, { name: '', category: 'Packaging', qtyPerUnit: 1, unit: 'pcs' }]
    });
  };

  const removeBomItem = (index: number) => {
    const newItems = [...formData.bomItems];
    newItems.splice(index, 1);
    setFormData({ ...formData, bomItems: newItems });
  };

  const updateBomItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.bomItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, bomItems: newItems });
  };

  return (
    <div>
      <div className="card-header">
        <div>
          <h1 style={{marginBottom:'0.5rem'}}>Manufacturing DNA</h1>
          <p style={{color:'var(--text-muted)'}}>Manage standard process templates and BOM blueprints.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingId('new'); setFormData({ name: '', category: 'Liquid', description: '', idealSpeed: 60, targetOEE: 85, ingredientRatio: 1.0, setupTimeMins: 30, bomItems: [] }); }}>
          <span>+</span> Create Template
        </button>
      </div>

      {loading ? (
        <div style={{padding:'4rem', textAlign:'center', color:'var(--text-muted)'}}>Loading DNA templates...</div>
      ) : (
        <div className="grid-cols-2">
          {templates.map(t => (
            <div key={t.id} className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <div>
                <div style={{display:'flex', gap:'0.75rem', alignItems:'center', marginBottom:'0.5rem'}}>
                  <span style={{fontSize:'1.5rem'}}>🧬</span>
                  <strong style={{fontSize:'1.1rem'}}>{t.name}</strong>
                  <span className="badge badge-running">{t.category}</span>
                </div>
                <div style={{fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'1rem'}}>{t.description || 'No description provided.'}</div>
                
                <div style={{display:'flex', gap:'1.5rem', flexWrap:'wrap'}}>
                  <div>
                    <div style={{fontSize:'0.75rem', textTransform:'uppercase', color:'var(--text-muted)'}}>Speed</div>
                    <div style={{fontWeight:600}}>{t.idealSpeed} units/min</div>
                  </div>
                  <div>
                    <div style={{fontSize:'0.75rem', textTransform:'uppercase', color:'var(--text-muted)'}}>Target OEE</div>
                    <div style={{fontWeight:600}}>{t.targetOEE}%</div>
                  </div>
                  <div>
                    <div style={{fontSize:'0.75rem', textTransform:'uppercase', color:'var(--text-muted)'}}>BOM Items</div>
                    <div style={{fontWeight:600}}>{t.templateBoms?.length || 0} items</div>
                  </div>
                </div>
              </div>
              <button className="btn btn-outline" onClick={() => handleEdit(t)}>Edit DNA</button>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal/Panel Overlay */}
      {editingId && (
        <div style={{position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', justifyContent:'flex-end'}}>
          <div style={{width:'600px', backgroundColor:'var(--bg-surface)', height:'100%', padding:'2rem', overflowY:'auto', boxShadow:'-10px 0 30px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem'}}>
              <h2>{editingId === 'new' ? 'New DNA Template' : 'Edit Template DNA'}</h2>
              <button className="btn btn-outline" onClick={() => setEditingId(null)}>Close</button>
            </div>

            <div className="form-section">
              <h3 style={{fontSize:'0.9rem', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'1rem'}}>General Information</h3>
              <div className="input-group">
                <label className="input-label">Template Name</label>
                <input className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Standard Liquid 500ml" />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option>Liquid</option>
                    <option>Cream</option>
                    <option>Powder</option>
                    <option>Aerosol</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Setup Time (Mins)</label>
                  <input type="number" className="input-field" value={formData.setupTimeMins} onChange={e => setFormData({...formData, setupTimeMins: parseInt(e.target.value)})} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 style={{fontSize:'0.9rem', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'1rem'}}>Performance Targets</h3>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Ideal Speed (u/min)</label>
                  <input type="number" className="input-field" value={formData.idealSpeed} onChange={e => setFormData({...formData, idealSpeed: parseInt(e.target.value)})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Target OEE (%)</label>
                  <input type="number" className="input-field" value={formData.targetOEE} onChange={e => setFormData({...formData, targetOEE: parseFloat(e.target.value)})} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                <h3 style={{fontSize:'0.9rem', textTransform:'uppercase', color:'var(--text-muted)'}}>BOM Blueprint</h3>
                <button className="btn btn-outline" style={{padding:'0.25rem 0.75rem', fontSize:'0.75rem'}} onClick={addBomItem}>+ Add Item</button>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
                {formData.bomItems.map((item: any, i: number) => (
                  <div key={i} style={{padding:'1rem', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', backgroundColor:'var(--bg-main)'}}>
                    <div className="form-row">
                      <div className="input-group" style={{marginBottom:0}}>
                        <input className="input-field" style={{padding:'0.5rem'}} placeholder="Item Name" value={item.name} onChange={e => updateBomItem(i, 'name', e.target.value)} />
                      </div>
                      <div className="input-group" style={{marginBottom:0}}>
                        <select className="input-field" style={{padding:'0.5rem'}} value={item.category} onChange={e => updateBomItem(i, 'category', e.target.value)}>
                          <option>Packaging</option>
                          <option>Raw Material</option>
                          <option>Bulk</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row" style={{marginTop:'0.5rem', alignItems:'center'}}>
                      <div style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
                        <input type="number" className="input-field" style={{padding:'0.5rem', width:'80px'}} value={item.qtyPerUnit} onChange={e => updateBomItem(i, 'qtyPerUnit', parseFloat(e.target.value))} />
                        <span style={{fontSize:'0.85rem'}}>{item.unit}</span>
                      </div>
                      <button style={{color:'var(--color-danger)', background:'none', border:'none', cursor:'pointer', textAlign:'right'}} onClick={() => removeBomItem(i)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setEditingId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Template DNA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
