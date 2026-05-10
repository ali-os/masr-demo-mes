'use client';
import { useState, useEffect } from 'react';

const BOM_CATEGORIES = ['Bottle', 'Cap', 'Sticker', 'Carton', 'Label', 'Sleeve', 'Sachet Bag', 'Aluminum Tube', 'Other'];

export default function TemplateManagement() {
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
  const [saving, setSaving] = useState(false);

  const fetchTemplates = () => {
    setLoading(true);
    fetch('/api/templates')
      .then(r => r.json())
      .then(d => { 
        const list = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
        setTemplates(list); 
        setLoading(false); 
      })
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
    setSaving(true);
    const method = editingId && editingId !== 'new' ? 'PUT' : 'POST';
    const body = editingId && editingId !== 'new' ? { id: editingId, ...formData } : formData;

    const res = await fetch('/api/templates', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      setEditingId(null);
      fetchTemplates();
    }
    setSaving(false);
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
            <div key={t.id} className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderTop:'4px solid var(--color-primary)'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex', gap:'0.75rem', alignItems:'center', marginBottom:'0.5rem'}}>
                  <span style={{fontSize:'1.5rem'}}>🧬</span>
                  <strong style={{fontSize:'1.1rem'}}>{t.name}</strong>
                  <span className="badge badge-running">{t.category}</span>
                </div>
                <div style={{fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'1.5rem'}}>{t.description || 'No description provided.'}</div>
                
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.5rem'}}>
                  <div style={{backgroundColor:'var(--bg-main)', padding:'0.75rem', borderRadius:'8px', textAlign:'center'}}>
                    <div style={{fontSize:'0.65rem', fontWeight:700, color:'var(--text-muted)'}}>IDEAL SPEED</div>
                    <div style={{fontSize:'1.1rem', fontWeight:800, color:'var(--color-success)'}}>{t.idealSpeed} BPM</div>
                  </div>
                  <div style={{backgroundColor:'var(--bg-main)', padding:'0.75rem', borderRadius:'8px', textAlign:'center'}}>
                    <div style={{fontSize:'0.65rem', fontWeight:700, color:'var(--text-muted)'}}>TARGET OEE</div>
                    <div style={{fontSize:'1.1rem', fontWeight:800, color:'var(--color-primary)'}}>{t.targetOEE}%</div>
                  </div>
                </div>

                <div style={{borderTop:'1px solid var(--border-light)', paddingTop:'1rem'}}>
                  <div style={{fontSize:'0.75rem', fontWeight:700, marginBottom:'0.5rem'}}>BOM BLUEPRINT ({t.templateBoms?.length || 0})</div>
                  <div style={{display:'flex', gap:'0.25rem', flexWrap:'wrap'}}>
                    {t.templateBoms?.map((b: any, i: number) => (
                      <span key={i} style={{fontSize:'0.7rem', padding:'2px 8px', border:'1px solid var(--border-light)', borderRadius:'4px', backgroundColor:'#fff'}}>
                        {b.name} ({b.qtyPerUnit})
                      </span>
                    ))}
                    {(!t.templateBoms || t.templateBoms.length === 0) && <span style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>No items defined</span>}
                  </div>
                </div>
              </div>
              <button className="btn btn-outline" style={{marginLeft:'1rem'}} onClick={() => handleEdit(t)}>Edit DNA</button>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal/Panel Overlay */}
      {editingId && (
        <div style={{position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', justifyContent:'flex-end'}}>
          <div style={{width:'650px', backgroundColor:'var(--bg-surface)', height:'100%', padding:'2.5rem', overflowY:'auto', boxShadow:'-10px 0 30px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2.5rem', borderBottom:'1px solid var(--border-light)', paddingBottom:'1.5rem'}}>
              <div>
                <h2 style={{fontSize:'1.5rem'}}>{editingId === 'new' ? 'Create DNA Template' : 'Edit Template DNA'}</h2>
                <p style={{fontSize:'0.85rem', color:'var(--text-muted)', marginTop:'0.25rem'}}>Define standard parameters for this product family.</p>
              </div>
              <button className="btn btn-outline" onClick={() => setEditingId(null)}>✕</button>
            </div>

            <div className="form-section">
              <h3 style={{fontSize:'0.9rem', textTransform:'uppercase', color:'var(--color-primary)', marginBottom:'1.25rem', fontWeight:700}}>1. Basic Identity</h3>
              <div className="input-group">
                <label className="input-label">Template Name</label>
                <input className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Standard Liquid 500ml" />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {['Cream','Liquid','Roll-on','Sachet','Stick','Gel','Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Setup Time (Mins)</label>
                  <input type="number" className="input-field" value={formData.setupTimeMins} onChange={e => setFormData({...formData, setupTimeMins: parseInt(e.target.value)})} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 style={{fontSize:'0.9rem', textTransform:'uppercase', color:'var(--color-success)', marginBottom:'1.25rem', fontWeight:700}}>2. Performance Targets</h3>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Ideal Speed (BPM)</label>
                  <input type="number" className="input-field" value={formData.idealSpeed} onChange={e => setFormData({...formData, idealSpeed: parseInt(e.target.value)})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Target OEE (%)</label>
                  <input type="number" className="input-field" value={formData.targetOEE} onChange={e => setFormData({...formData, targetOEE: parseFloat(e.target.value)})} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Ingredient Ratio (KG/Unit)</label>
                <input type="number" step="0.0001" className="input-field" value={formData.ingredientRatio} onChange={e => setFormData({...formData, ingredientRatio: parseFloat(e.target.value)})} />
              </div>
            </div>

            <div className="form-section">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem'}}>
                <h3 style={{fontSize:'0.9rem', textTransform:'uppercase', color:'var(--color-warning)', fontWeight:700}}>3. BOM Blueprint</h3>
                <button className="btn btn-outline" style={{padding:'0.4rem 0.8rem', fontSize:'0.75rem'}} onClick={addBomItem}>+ Add Item</button>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
                {formData.bomItems.map((item: any, i: number) => (
                  <div key={i} style={{padding:'1.25rem', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', backgroundColor:'var(--bg-main)'}}>
                    <div className="form-row" style={{marginBottom:'0.75rem'}}>
                      <div className="input-group" style={{marginBottom:0, flex:2}}>
                        <input className="input-field" style={{padding:'0.6rem'}} placeholder="Item Name (e.g. Bottle)" value={item.name} onChange={e => updateBomItem(i, 'name', e.target.value)} />
                      </div>
                      <div className="input-group" style={{marginBottom:0, flex:1}}>
                        <select className="input-field" style={{padding:'0.6rem'}} value={item.category} onChange={e => updateBomItem(i, 'category', e.target.value)}>
                          {BOM_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div style={{display:'flex', gap:'0.75rem', alignItems:'center'}}>
                        <input type="number" className="input-field" style={{padding:'0.6rem', width:'100px'}} value={item.qtyPerUnit} onChange={e => updateBomItem(i, 'qtyPerUnit', parseFloat(e.target.value))} />
                        <select className="input-field" style={{padding:'0.6rem', width:'80px'}} value={item.unit} onChange={e => updateBomItem(i, 'unit', e.target.value)}>
                          <option>pcs</option><option>kg</option><option>ml</option><option>g</option>
                        </select>
                      </div>
                      <button style={{color:'var(--color-danger)', background:'none', border:'none', cursor:'pointer', fontSize:'0.85rem', fontWeight:600}} onClick={() => removeBomItem(i)}>Delete</button>
                    </div>
                  </div>
                ))}
                {formData.bomItems.length === 0 && (
                  <div style={{textAlign:'center', padding:'2rem', border:'2px dashed var(--border-light)', borderRadius:'var(--radius-md)', color:'var(--text-muted)', fontSize:'0.85rem'}}>
                    No materials defined. Click "+ Add Item" to build the BOM template.
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions" style={{position:'sticky', bottom:0, backgroundColor:'var(--bg-surface)', paddingBottom:'1rem'}}>
              <button className="btn btn-outline" style={{flex:1}} onClick={() => setEditingId(null)}>Cancel</button>
              <button className="btn btn-primary" style={{flex:2}} onClick={handleSave} disabled={saving || !formData.name}>
                {saving ? 'Saving DNA...' : 'Save Template DNA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
