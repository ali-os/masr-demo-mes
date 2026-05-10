'use client';
import { useState, useEffect } from 'react';
import masterData from '@/lib/master-data.json';

const BOM_CATEGORIES = ['Bottle', 'Cap', 'Sticker', 'Carton', 'Label', 'Sleeve', 'Sachet Bag', 'Aluminum Tube', 'Other'];

export default function ProductManagement() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [bomItems, setBomItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'list'|'detail'>('list');
  const [isAddingBom, setIsAddingBom] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newBom, setNewBom] = useState({ name: '', category: 'Bottle', qtyPerUnit: 1, unit: 'pcs', itemCode: '', notes: '' });
  const [newProduct, setNewProduct] = useState({
    skuCode:'', nameEn:'', nameAr:'', brand:'', family:'', category:'', packSizeMl:'',
    ingredientRatio:0, idealSpeed:60, targetOEE:85, setupTimeMins:30, uom:'pcs'
  });
  const [saving, setSaving] = useState(false);

  const [activeCategory, setActiveCategory] = useState('All');
  const [templates, setTemplates] = useState<any[]>([]);
  const CATEGORIES = ['All', 'Cream', 'Liquid', 'Roll-on', 'Stick', 'Gel', 'Sachet', 'Other'];

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(d => setProducts(Array.isArray(d.data) ? d.data : []));
    fetch('/api/templates').then(r => r.json()).then(d => setTemplates(Array.isArray(d.data) ? d.data : []));
  }, []);

  const openProduct = async (p: any) => {
    setSelectedProduct(p);
    setActiveTab('detail');
    const res = await fetch(`/api/bom/${p.id}`).then(r => r.json());
    setBomItems(Array.isArray(res.data) ? res.data : []);
  };

  const handleAddBom = async () => {
    if (!newBom.name || !selectedProduct) return;
    setSaving(true);
    const res = await fetch(`/api/bom/${selectedProduct.id}`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify(newBom)
    });
    const item = await res.json();
    setBomItems(prev => [...prev, item]);
    setNewBom({ name:'', category:'Bottle', qtyPerUnit:1, unit:'pcs', itemCode:'', notes:'' });
    setIsAddingBom(false);
    setSaving(false);
  };

  const handleDeleteBom = async (itemId: string) => {
    if (!selectedProduct) return;
    await fetch(`/api/bom/${selectedProduct.id}?itemId=${itemId}`, { method: 'DELETE' });
    setBomItems(prev => prev.filter(b => b.id !== itemId));
  };

  const handleAddProduct = async () => {
    setSaving(true);
    const res = await fetch('/api/products', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(newProduct)
    });
    if (res.ok) {
      const p = await res.json();
      setProducts(prev => [p.data, ...prev]);
      setIsAddingProduct(false);
      setNewProduct({
        skuCode:'', nameEn:'', nameAr:'', brand:'', family:'', category:'', packSizeMl:'',
        ingredientRatio:0, idealSpeed:60, targetOEE:85, setupTimeMins:30, uom:'pcs'
      });
    }
    setSaving(false);
  };

  const bomCategoryIcon = (cat: string) => {
    const icons: Record<string,string> = { Bottle:'🍶', Cap:'🔵', Sticker:'🏷️', Carton:'📦', Label:'📋', Sleeve:'🧶', 'Sachet Bag':'🛍️', 'Aluminum Tube':'🖊️', Other:'📎' };
    return icons[cat] || '📎';
  };

  const filtered = products.filter(p => {
    const matchesSearch = !search || 
      p.skuCode?.includes(search) || 
      p.nameEn?.toLowerCase().includes(search.toLowerCase()) ||
      p.nameAr?.includes(search) ||
      p.brand?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory || p.family?.includes(activeCategory);
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="card-header">
        <div>
          <h1 className="card-title" style={{fontSize:'2rem'}}>Product DNA &amp; Master Data</h1>
          <p style={{color:'var(--text-muted)', fontSize:'0.9rem', marginTop:'0.25rem'}}>{products.length} Industrial SKUs — Line constraints &amp; BOM</p>
        </div>
        <div style={{display:'flex', gap:'0.75rem'}}>
          {activeTab === 'detail' && selectedProduct && (
            <button className="btn btn-outline" onClick={() => { setActiveTab('list'); setSelectedProduct(null); }}>← Back to List</button>
          )}
          <button className="btn btn-primary" onClick={() => setIsAddingProduct(true)}>+ New SKU</button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="card">
          <div style={{display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap'}}>
            <input className="input-field" style={{flex:1, minWidth:'300px'}} placeholder="🔍  Search by SKU, Name (EN/AR), or Brand..."
              value={search} onChange={e => setSearch(e.target.value)} />
            
            <div style={{display:'flex', backgroundColor:'var(--bg-main)', padding:'4px', borderRadius:'8px', gap:'4px'}}>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding:'6px 12px', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem', fontWeight:600,
                    backgroundColor: activeCategory === cat ? 'var(--color-primary)' : 'transparent',
                    color: activeCategory === cat ? '#fff' : 'var(--text-muted)',
                    transition:'all 0.2s'
                  }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>SKU Code</th><th>Name &amp; Brand</th><th>Category</th>
                  <th>Machine Compatibility</th><th>Ratio (KG/u)</th><th>BOM Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={i}>
                    <td style={{fontFamily:'monospace',fontSize:'0.85rem', fontWeight:700}}>{p.skuCode}</td>
                    <td style={{maxWidth:'250px'}}>
                      <div style={{fontWeight:600, color:'var(--text-main)'}}>{p.nameEn}</div>
                      <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{p.brand} | {p.family}</div>
                      {p.nameAr && <div style={{fontSize:'0.8rem', direction:'rtl', color:'var(--text-muted)', marginTop:'2px'}}>{p.nameAr}</div>}
                    </td>
                    <td><span className="badge badge-waiting" style={{backgroundColor:'rgba(0,0,0,0.05)', color:'var(--text-main)'}}>{p.category || p.family || 'Other'}</span></td>
                    <td>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                        {p.compatibleLines?.length > 0
                          ? p.compatibleLines.map((l:string,j:number) => (
                              <span key={j} style={{fontSize:'0.7rem',padding:'2px 8px',backgroundColor:'rgba(79,70,229,0.1)',color:'var(--color-primary)',borderRadius:'4px',fontWeight:700}}>{l.toUpperCase()}</span>
                            ))
                          : <span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>UNIVERSAL</span>}
                      </div>
                    </td>
                    <td style={{fontWeight:800,color:'var(--color-primary)',textAlign:'right'}}>{p.ingredientRatio}</td>
                    <td style={{textAlign:'center'}}>
                      <span style={{fontSize:'0.75rem', fontWeight:600, color:'var(--color-success)'}}>✅ Configured</span>
                    </td>
                    <td>
                      <button className="btn btn-outline" style={{padding:'0.4rem 1rem',fontSize:'0.8rem', fontWeight:600}} onClick={() => openProduct(p)}>
                        ⚙️ Configure DNA
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'detail' && selectedProduct && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem'}}>
          {/* Product Info */}
          <div className="card">
            <h2 className="card-title" style={{marginBottom:'1.5rem'}}>Product Details</h2>
            <div style={{display:'flex', flexDirection:'column', gap:'0.75rem', fontSize:'0.9rem'}}>
              {[
                ['SKU Code', selectedProduct.skuCode],
                ['Name (EN)', selectedProduct.nameEn],
                ['Name (AR)', selectedProduct.nameAr || '—'],
                ['Brand', selectedProduct.brand || '—'],
                ['Family', selectedProduct.family || '—'],
                ['Category', selectedProduct.category || '—'],
                ['Pack Size', selectedProduct.packSizeMl ? `${selectedProduct.packSizeMl} ml` : '—'],
                ['Volume (Fill)', selectedProduct.volumeMl ? `${selectedProduct.volumeMl} ml` : '—'],
              ].map(([k,v]) => (
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem 0',borderBottom:'1px solid var(--border-light)'}}>
                  <span style={{color:'var(--text-muted)',fontWeight:500}}>{k}</span>
                  <span style={{fontWeight:600}}>{v}</span>
                </div>
              ))}
              <div style={{marginTop:'1rem'}}>
                <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.5rem',fontWeight:600}}>COMPATIBLE LINES</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem'}}>
                  {selectedProduct.compatibleLines?.length > 0
                    ? selectedProduct.compatibleLines.map((l:string,j:number) => (
                        <span key={j} style={{padding:'4px 12px',backgroundColor:'rgba(79,70,229,0.1)',color:'var(--color-primary)',borderRadius:'999px',fontSize:'0.82rem',fontWeight:600}}>{l}</span>
                      ))
                    : <span style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>No line restriction</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Production Parameters */}
          <div className="card">
            <h2 className="card-title" style={{marginBottom:'1.5rem'}}>Production Parameters</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
              {[
                ['Ingredient Ratio', `${selectedProduct.ingredientRatio} KG/unit`, 'var(--color-primary)'],
                ['Ideal Speed', `${selectedProduct.idealSpeed} BPM`, 'var(--color-success)'],
                ['Target OEE', `${selectedProduct.targetOEE}%`, 'var(--color-warning)'],
                ['Setup Time', `${selectedProduct.setupTimeMins} min`, 'var(--color-danger)'],
              ].map(([k,v,c]) => (
                <div key={k} className="card" style={{textAlign:'center',padding:'1rem',borderTop:`3px solid ${c}`}}>
                  <div style={{fontSize:'0.75rem',color:'var(--text-muted)',fontWeight:600}}>{k}</div>
                  <div style={{fontSize:'1.5rem',fontWeight:800,color:c,marginTop:'0.25rem'}}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* BOM — Full Width */}
          <div className="card" style={{gridColumn:'1 / -1'}}>
            <div className="card-header">
              <h2 className="card-title">Bill of Materials — Packaging</h2>
              <button className="btn btn-primary" style={{padding:'0.4rem 1rem',fontSize:'0.85rem'}} onClick={() => setIsAddingBom(true)}>+ Add Item</button>
            </div>

            {bomItems.length === 0 ? (
              <div style={{textAlign:'center',padding:'2.5rem',color:'var(--text-muted)'}}>
                <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>📦</div>
                <div>No packaging items defined yet.</div>
                <div style={{fontSize:'0.85rem',marginTop:'0.25rem'}}>Add bottles, caps, stickers, cartons etc.</div>
                <button className="btn btn-outline" style={{marginTop:'1rem'}} onClick={() => setIsAddingBom(true)}>Add First BOM Item</button>
              </div>
            ) : (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'1rem', marginTop:'1rem'}}>
                {bomItems.map((b, i) => (
                  <div key={i} style={{padding:'1rem',border:'1px solid var(--border-light)',borderRadius:'var(--radius-md)',position:'relative'}}>
                    <button onClick={() => handleDeleteBom(b.id)}
                      style={{position:'absolute',top:'0.5rem',right:'0.5rem',background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:'1rem'}}>✕</button>
                    <div style={{fontSize:'1.5rem',marginBottom:'0.5rem'}}>{bomCategoryIcon(b.category)}</div>
                    <div style={{fontWeight:600,fontSize:'0.9rem'}}>{b.name}</div>
                    <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:'0.25rem'}}>{b.category}</div>
                    {b.itemCode && <div style={{fontSize:'0.75rem',fontFamily:'monospace',color:'var(--text-muted)'}}>{b.itemCode}</div>}
                    <div style={{marginTop:'0.75rem',padding:'0.5rem',backgroundColor:'var(--bg-main)',borderRadius:'6px',textAlign:'center'}}>
                      <span style={{fontWeight:800,color:'var(--color-primary)'}}>{b.qtyPerUnit}</span>
                      <span style={{fontSize:'0.8rem',color:'var(--text-muted)',marginLeft:'0.25rem'}}>{b.unit} per unit</span>
                    </div>
                    {b.notes && <div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:'0.5rem',fontStyle:'italic'}}>{b.notes}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Add BOM Modal */}
            {isAddingBom && (
              <div style={{marginTop:'2rem',padding:'1.5rem',border:'2px dashed var(--color-primary)',borderRadius:'var(--radius-md)',backgroundColor:'rgba(79,70,229,0.03)'}}>
                <h3 style={{marginBottom:'1rem',color:'var(--color-primary)'}}>Add Packaging Item</h3>
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">CATEGORY</label>
                    <select className="input-field" value={newBom.category} onChange={e => setNewBom({...newBom, category:e.target.value})}>
                      {BOM_CATEGORIES.map(c => <option key={c} value={c}>{bomCategoryIcon(c)} {c}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">ITEM NAME</label>
                    <input className="input-field" placeholder={`e.g. White PP Cap 20mm`} value={newBom.name} onChange={e => setNewBom({...newBom, name:e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">ITEM CODE (optional)</label>
                    <input className="input-field" placeholder="e.g. CAP-20-WHT" value={newBom.itemCode} onChange={e => setNewBom({...newBom, itemCode:e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">QTY PER UNIT</label>
                    <input className="input-field" type="number" step="0.001" value={newBom.qtyPerUnit} onChange={e => setNewBom({...newBom, qtyPerUnit:Number(e.target.value)})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">UNIT</label>
                    <select className="input-field" value={newBom.unit} onChange={e => setNewBom({...newBom, unit:e.target.value})}>
                      {['pcs','gm','ml','m'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">NOTES</label>
                  <input className="input-field" placeholder="Optional notes..." value={newBom.notes} onChange={e => setNewBom({...newBom, notes:e.target.value})} />
                </div>
                <div style={{display:'flex',gap:'1rem',marginTop:'1rem'}}>
                  <button className="btn btn-outline" onClick={() => setIsAddingBom(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleAddBom} disabled={saving || !newBom.name}>
                    {saving ? 'Saving...' : 'Add to BOM'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {isAddingProduct && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div className="card" style={{width:'700px',padding:'2.5rem',maxHeight:'90vh',overflowY:'auto'}}>
            <h2 className="card-title" style={{borderBottom:'1px solid var(--border-light)',paddingBottom:'1rem',marginBottom:'1.5rem'}}>New Product SKU</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
              <div style={{padding:'1rem', backgroundColor:'rgba(79,70,229,0.05)', borderRadius:'8px', border:'1px solid var(--color-primary)'}}>
                <label className="input-label" style={{color:'var(--color-primary)', fontWeight:700}}>LOAD FROM DNA TEMPLATE</label>
                <select className="input-field" onChange={e => {
                  const t = templates.find(temp => temp.id === e.target.value);
                  if (t) {
                    setNewProduct({
                      ...newProduct,
                      category: t.category || '',
                      ingredientRatio: t.ingredientRatio || 0,
                      idealSpeed: t.idealSpeed || 60,
                      targetOEE: t.targetOEE || 85,
                      setupTimeMins: t.setupTimeMins || 30
                    });
                  }
                }}>
                  <option value="">-- Select Template --</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <p style={{fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.5rem'}}>Selecting a template will auto-fill industrial parameters and BOM defaults.</p>
              </div>

              <div>
                <h3 style={{fontSize:'0.8rem',color:'var(--text-muted)',letterSpacing:'0.1em',marginBottom:'1rem'}}>IDENTIFICATION</h3>
                <div className="form-row">
                  <div className="input-group"><label className="input-label">SKU CODE *</label><input className="input-field" placeholder="e.g. 40740030" value={newProduct.skuCode} onChange={e=>setNewProduct({...newProduct,skuCode:e.target.value})} /></div>
                  <div className="input-group"><label className="input-label">BRAND *</label><input className="input-field" list="brand-list" placeholder="Brand name" value={newProduct.brand} onChange={e=>setNewProduct({...newProduct,brand:e.target.value})} /><datalist id="brand-list">{masterData.brands?.map(b=><option key={b} value={b}/>)}</datalist></div>
                </div>
                <div className="form-row">
                  <div className="input-group"><label className="input-label">FAMILY</label><input className="input-field" list="family-list" placeholder="e.g. Lotion" value={newProduct.family} onChange={e=>setNewProduct({...newProduct,family:e.target.value})} /><datalist id="family-list">{masterData.families?.map(f=><option key={f} value={f}/>)}</datalist></div>
                  <div className="input-group"><label className="input-label">CATEGORY</label><select className="input-field" value={newProduct.category} onChange={e=>setNewProduct({...newProduct,category:e.target.value})}><option value="">Select...</option>{['Cream','Liquid','Sachet','Tin','Roll-on','Stick','Gel','Other'].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <div className="form-row">
                  <div className="input-group"><label className="input-label">NAME (ENGLISH)</label><input className="input-field" placeholder="Full product name" value={newProduct.nameEn} onChange={e=>setNewProduct({...newProduct,nameEn:e.target.value})} /></div>
                  <div className="input-group"><label className="input-label">NAME (ARABIC)</label><input className="input-field" placeholder="اسم المنتج" style={{direction:'rtl'}} value={newProduct.nameAr} onChange={e=>setNewProduct({...newProduct,nameAr:e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="input-group"><label className="input-label">PACK SIZE (ml)</label><input className="input-field" type="number" placeholder="e.g. 200" value={newProduct.packSizeMl} onChange={e=>setNewProduct({...newProduct,packSizeMl:e.target.value})} /></div>
                  <div className="input-group"><label className="input-label">UOM</label><select className="input-field" value={newProduct.uom} onChange={e=>setNewProduct({...newProduct,uom:e.target.value})}>{(masterData.uoms||['pcs','kg']).map(u=><option key={u} value={u}>{u.toUpperCase()}</option>)}</select></div>
                </div>
              </div>
              <div>
                <h3 style={{fontSize:'0.8rem',color:'var(--text-muted)',letterSpacing:'0.1em',marginBottom:'1rem'}}>PRODUCTION PARAMETERS</h3>
                <div className="form-row">
                  <div className="input-group"><label className="input-label">INGREDIENT RATIO (KG/UNIT)</label><input className="input-field" type="number" step="0.0001" placeholder="0.015" value={newProduct.ingredientRatio||''} onChange={e=>setNewProduct({...newProduct,ingredientRatio:Number(e.target.value)})} /></div>
                  <div className="input-group"><label className="input-label">IDEAL SPEED (BPM)</label><input className="input-field" type="number" defaultValue={60} onChange={e=>setNewProduct({...newProduct,idealSpeed:Number(e.target.value)})} /></div>
                </div>
                <div className="form-row">
                  <div className="input-group"><label className="input-label">TARGET OEE (%)</label><input className="input-field" type="number" defaultValue={85} onChange={e=>setNewProduct({...newProduct,targetOEE:Number(e.target.value)})} /></div>
                  <div className="input-group"><label className="input-label">SETUP TIME (MINS)</label><input className="input-field" type="number" defaultValue={30} onChange={e=>setNewProduct({...newProduct,setupTimeMins:Number(e.target.value)})} /></div>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setIsAddingProduct(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddProduct}>Create SKU</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
