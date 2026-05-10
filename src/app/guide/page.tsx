'use client';
import { useState } from 'react';
import Link from 'next/link';

const STEPS = [
  {
    number: 1,
    title: 'Create DNA Template',
    titleAr: 'إنشاء قالب المنتج',
    role: 'Engineer',
    roleColor: '#8B5CF6',
    icon: '🧬',
    page: '/settings/templates',
    pageLabel: 'DNA Templates',
    status: 'live',
    description: 'Define reusable manufacturing blueprints for product families. Each template stores the standard ingredient ratio (KG/unit), ideal machine speed (BPM), target OEE, setup time, and a complete list of packaging materials (BOM).',
    example: 'Example: Create a "Standard Roll-on 50ml" template with 0.048 KG/unit ratio, 45 BPM speed, and BOM items: Bottle, Ball, Cap, Sticker.',
    whatYouDo: [
      'Click "+ New Template"',
      'Enter template name and category (Cream, Liquid, Roll-on...)',
      'Set the Ingredient Ratio, Ideal Speed, Target OEE, and Setup Time',
      'Add BOM items (Bottle, Cap, Sticker, Carton...)',
      'Save the DNA Template'
    ],
    output: 'A reusable blueprint that can be applied to any product in the same family.'
  },
  {
    number: 2,
    title: 'Create Product SKU',
    titleAr: 'إنشاء منتج جديد',
    role: 'Engineer',
    roleColor: '#8B5CF6',
    icon: '📦',
    page: '/settings/products',
    pageLabel: 'Product DNA Master',
    status: 'live',
    description: 'Register a new SKU in the 842-product master catalog. You can load a DNA Template to auto-fill all production parameters, then customize any SKU-specific overrides.',
    example: 'Example: Create SKU 40740030 "Vebix Classic 15g" → Load "Kalix Cream" template → Override speed to 40 BPM for this specific size.',
    whatYouDo: [
      'Click "+ New SKU"',
      'Select a DNA Template to auto-fill parameters (optional)',
      'Enter SKU Code, Name (EN/AR), Brand, Family, Category',
      'Review and adjust the inherited Speed, Ratio, OEE values',
      'Save the product'
    ],
    output: 'A fully configured SKU ready to be planned for production.'
  },
  {
    number: 3,
    title: 'Create Monthly Plan (MPS)',
    titleAr: 'إنشاء خطة الإنتاج الشهرية',
    role: 'Planner',
    roleColor: '#3B82F6',
    icon: '📅',
    page: '/planning',
    pageLabel: 'MPS Plan Board',
    status: 'live',
    description: 'Create the Master Production Schedule for the month. Select SKUs, assign them to filling machines, and set target quantities. The system auto-calculates Bulk KG required and estimated production time from the product\'s template.',
    example: 'Example: Plan 40,000 pcs of Vebix 15g on Kalix → System calculates 600 KG bulk needed and ~17 hours runtime.',
    whatYouDo: [
      'Select Year and Month',
      'Click "+ Add Plan"',
      'Search and select a product from the 842-SKU catalog',
      'Set the filling machine and target quantity',
      'Review the auto-calculated Bulk KG and Est. Runtime',
      'Click "Release to MPS"'
    ],
    output: 'A monthly production schedule with auto-calculated material requirements. Visible to all departments.'
  },
  {
    number: 4,
    title: 'Check Material Readiness',
    titleAr: 'التحقق من جاهزية المواد',
    role: 'Stores',
    roleColor: '#F59E0B',
    icon: '✔️',
    page: '/stores',
    pageLabel: 'Stores & Issue',
    status: 'live',
    description: 'Review the material readiness for each planned SKU. The system calculates the bulk ingredient requirement from the plan and flags potential shortages before production starts.',
    example: 'Example: SKU needs 2,125 KG of Glysolid bulk → System flags SHORTAGE if current stock is below threshold.',
    whatYouDo: [
      'Open the Stores & Issue page',
      'Review the "Material Shortage Alerts" table',
      'Check which SKUs have SHORTAGE status',
      'Coordinate with Purchasing for missing materials',
      'Issue materials to the line when ready'
    ],
    output: 'Confirmed material availability before production starts. No surprise shortages during a shift.'
  },
  {
    number: 5,
    title: 'Prepare Bulk Ingredients',
    titleAr: 'تحضير المواد الخام',
    role: 'Preparation',
    roleColor: '#10B981',
    icon: '🧪',
    page: '/preparation',
    pageLabel: 'Preparation & Mixing',
    status: 'live',
    description: 'The Preparation department views bulk ingredient requirements calculated from MPS plans. The system shows the exact KG needed per SKU, tracks consumption progress, and breaks down needs by product category.',
    example: 'Example: Mix 600 KG of Vebix cream base in Tank A → System tracks batch progress and yield %.',
    whatYouDo: [
      'View the required bulk preparation list (from MPS)',
      'Start a new batch with the required KG',
      'Record actual ingredients consumed',
      'Submit for QA release when mixing is complete'
    ],
    output: 'Prepared bulk ready to be issued to the filling line.'
  },
  {
    number: 6,
    title: 'Enter Daily Shift Production',
    titleAr: 'إدخال إنتاج الوردية',
    role: 'Operator',
    roleColor: '#EF4444',
    icon: '✏️',
    page: '/production',
    pageLabel: 'Weekly Entry (W1-3)',
    status: 'live',
    description: 'Operators enter the actual pieces produced per shift (Shift 1 and Shift 2) for each day. The system tracks progress against the monthly plan in real time.',
    example: 'Example: Shift 1 produced 21,336 pcs of Vebix 15g on Sunday → Enter in the grid → SL% updates automatically.',
    whatYouDo: [
      'Select Year and Month',
      'Find your SKU row in the grid',
      'Enter Shift 1 and Shift 2 quantities for each day',
      'Data auto-saves when you move to the next cell',
      'Check the running total vs. monthly target'
    ],
    output: 'Real-time production tracking. Plan vs. Actual is updated instantly.'
  },
  {
    number: 7,
    title: 'Log OEE & Machine Losses',
    titleAr: 'تسجيل خسائر الماكينات',
    role: 'Operator',
    roleColor: '#EF4444',
    icon: '⏱️',
    page: '/production/oee',
    pageLabel: 'OEE & Loss Entry',
    status: 'live',
    description: 'Log downtime events and quality losses for each machine per shift. The system auto-calculates Availability, Performance, Quality, and overall OEE score.',
    example: 'Example: Kalix had 45 min mechanical failure + 15 min changeover → Enter minutes → OEE auto-calculates to 72.5%.',
    whatYouDo: [
      'Select Machine, Date, and Shift',
      'Enter downtime minutes per category (ADJ, MF, MIN, UT, WH)',
      'Enter good output quantity and reject quantity',
      'Review the auto-calculated A/P/Q/OEE scores',
      'Click "Save Record"'
    ],
    output: 'Complete machine performance record. OEE is calculated and stored for trending.'
  },
  {
    number: 8,
    title: 'Log Quality Rejects',
    titleAr: 'تسجيل المرفوضات',
    role: 'Quality',
    roleColor: '#06B6D4',
    icon: '🔬',
    page: '/quality',
    pageLabel: 'Quality Control',
    status: 'live',
    description: 'Quality inspectors log production rejects with specific defect reasons. The reject form saves directly to the database. Quality rate is calculated from OEE records, and rework entries from daily production are displayed.',
    example: 'Example: 45 units rejected for "Cap Alignment" on Glysolid 80g → Logged with corrective action taken.',
    whatYouDo: [
      'Select the Work Order and Line',
      'Choose the reject reason from the standard list',
      'Enter reject quantity',
      'Describe the corrective action taken',
      'Click "Log Reject"'
    ],
    output: 'Traceable quality records. Feeds into quality rate % and defect Pareto charts.'
  },
  {
    number: 9,
    title: 'Confirm Finished Goods',
    titleAr: 'تأكيد المنتج النهائي',
    role: 'FG Stores',
    roleColor: '#F59E0B',
    icon: '🏭',
    page: '/finished-goods',
    pageLabel: 'Finished Goods Receipt',
    status: 'live',
    description: 'Finished Goods tracking shows net good output (total produced minus rework) by product. Aggregates daily shift entries to provide a complete FG receipt view with today\'s totals and monthly summaries.',
    example: 'Example: 2,400 units of Lotion received on Pallet PLT-4421 → Confirmed and put away in Zone A.',
    whatYouDo: [
      'Select the Work Order',
      'Enter the received quantity and pallet/lot ID',
      'Select storage location',
      'Note any discrepancy between expected and received qty',
      'Click "Confirm FG Receipt"'
    ],
    output: 'Closed production loop. Achievement accuracy is tracked.'
  },
  {
    number: 10,
    title: 'Review Production Summary',
    titleAr: 'مراجعة ملخص الإنتاج',
    role: 'Supervisor',
    roleColor: '#6366F1',
    icon: '📊',
    page: '/production/summary',
    pageLabel: 'Production Summary',
    status: 'live',
    description: 'The production summary provides a complete view of Plan vs. Actual for every SKU in the month. It replaces the "Prod Summary" Excel sheet with live data.',
    example: 'Example: March 2026 shows 842 SKUs with 40.7% overall SL%, 12 SKUs at risk (<80%), and 2.18M total target.',
    whatYouDo: [
      'Select Year and Month',
      'Review the KPI headline cards (Target, Actual, SL%, Bulk)',
      'Scan the table for at-risk SKUs (red highlighting)',
      'Export to Excel for management reporting',
      'Drill into specific SKUs for daily breakdown'
    ],
    output: 'Complete monthly performance report. Replaces the manual Excel summary sheet.'
  },
  {
    number: 11,
    title: 'Plant Overview Dashboard',
    titleAr: 'لوحة القيادة العامة',
    role: 'Manager',
    roleColor: '#1E293B',
    icon: '🏭',
    page: '/dashboard',
    pageLabel: 'Plant Overview',
    status: 'live',
    description: 'The executive dashboard shows the overall plant health: MPS achievement, total production, OEE score, and machine states. This is the "at-a-glance" view for plant managers.',
    example: 'Example: March shows 2.18M planned, 888K produced (40.7% SL), 76.8% OEE with 2 machines running.',
    whatYouDo: [
      'Open the Dashboard (default landing page)',
      'Review Monthly MPS Target vs. Total Production',
      'Check the OEE score and machine states',
      'Click through to detailed pages for investigation'
    ],
    output: 'Executive-level plant performance snapshot. One screen to understand the entire factory.'
  }
];

export default function SystemGuide() {
  const [activeStep, setActiveStep] = useState(0);
  const [lang, setLang] = useState<'en'|'ar'>('en');
  const step = STEPS[activeStep];

  return (
    <div>
      <div className="card-header">
        <div>
          <h1 className="card-title" style={{fontSize:'2rem'}}>System Guide — End-to-End Workflow</h1>
          <p style={{color:'var(--text-muted)', fontSize:'0.9rem', marginTop:'0.25rem'}}>
            Follow these {STEPS.length} steps to understand the complete manufacturing flow
          </p>
        </div>
        <div style={{display:'flex', gap:'0.75rem'}}>
          <button className={`btn ${lang==='en'?'btn-primary':'btn-outline'}`} onClick={()=>setLang('en')}>English</button>
          <button className={`btn ${lang==='ar'?'btn-primary':'btn-outline'}`} onClick={()=>setLang('ar')}>عربي</button>
        </div>
      </div>

      {/* Flow Diagram */}
      <div className="card" style={{marginBottom:'1.5rem', padding:'1.5rem'}}>
        <div style={{display:'flex', alignItems:'center', gap:'0', overflowX:'auto', paddingBottom:'0.5rem'}}>
          {STEPS.map((s, i) => (
            <div key={i} style={{display:'flex', alignItems:'center', flexShrink:0}}>
              <button
                onClick={() => setActiveStep(i)}
                style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:'0.25rem',
                  padding:'0.5rem 0.75rem', borderRadius:'12px', border:'none', cursor:'pointer',
                  backgroundColor: activeStep === i ? 'rgba(79,70,229,0.12)' : 'transparent',
                  outline: activeStep === i ? '2px solid var(--color-primary)' : 'none',
                  transition:'all 0.2s'
                }}
              >
                <div style={{
                  width:'36px', height:'36px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'1.2rem',
                  backgroundColor: s.status === 'live' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  border: activeStep === i ? '2px solid var(--color-primary)' : '1px solid var(--border-light)'
                }}>
                  {s.icon}
                </div>
                <span style={{fontSize:'0.6rem', fontWeight:600, color: activeStep === i ? 'var(--color-primary)' : 'var(--text-muted)', maxWidth:'70px', textAlign:'center', lineHeight:1.2}}>
                  {s.title}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div style={{width:'20px', height:'2px', backgroundColor:'var(--border-light)', flexShrink:0}}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Step Detail */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 350px', gap:'1.5rem'}}>
        {/* Main Content */}
        <div>
          <div className="card" style={{borderTop:`4px solid ${step.roleColor}`, marginBottom:'1.5rem'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem'}}>
              <div>
                <div style={{display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.5rem'}}>
                  <span style={{fontSize:'2rem'}}>{step.icon}</span>
                  <div>
                    <h2 style={{fontSize:'1.5rem', fontWeight:800, margin:0}}>
                      Step {step.number}: {lang === 'ar' ? step.titleAr : step.title}
                    </h2>
                    <div style={{display:'flex', gap:'0.5rem', marginTop:'0.25rem'}}>
                      <span style={{
                        fontSize:'0.7rem', fontWeight:700, padding:'2px 10px', borderRadius:'999px',
                        backgroundColor: step.roleColor, color:'#fff'
                      }}>
                        {step.role}
                      </span>
                      <span style={{
                        fontSize:'0.7rem', fontWeight:700, padding:'2px 10px', borderRadius:'999px',
                        backgroundColor: step.status === 'live' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        color: step.status === 'live' ? 'var(--color-success)' : 'var(--color-warning)',
                        border: `1px solid ${step.status === 'live' ? 'var(--color-success)' : 'var(--color-warning)'}`
                      }}>
                        {step.status === 'live' ? '✅ LIVE' : '🔜 COMING SOON'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <Link href={step.page} className="btn btn-primary" style={{flexShrink:0}}>
                Open {step.pageLabel} →
              </Link>
            </div>

            <p style={{fontSize:'0.95rem', lineHeight:1.7, color:'var(--text-main)', marginBottom:'1.5rem'}}>
              {step.description}
            </p>

            <div style={{padding:'1rem', backgroundColor:'rgba(79,70,229,0.04)', borderRadius:'8px', border:'1px solid rgba(79,70,229,0.15)', marginBottom:'1.5rem'}}>
              <div style={{fontSize:'0.75rem', fontWeight:700, color:'var(--color-primary)', marginBottom:'0.25rem'}}>💡 EXAMPLE</div>
              <p style={{fontSize:'0.85rem', color:'var(--text-main)', margin:0}}>{step.example}</p>
            </div>

            <div style={{marginBottom:'1.5rem'}}>
              <h3 style={{fontSize:'0.85rem', fontWeight:700, letterSpacing:'0.05em', color:'var(--text-muted)', marginBottom:'1rem'}}>
                WHAT YOU DO (STEP BY STEP)
              </h3>
              <div style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                {step.whatYouDo.map((action, i) => (
                  <div key={i} style={{display:'flex', gap:'0.75rem', alignItems:'flex-start'}}>
                    <div style={{
                      width:'24px', height:'24px', borderRadius:'50%', flexShrink:0,
                      backgroundColor:'var(--color-primary)', color:'#fff',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'0.7rem', fontWeight:700
                    }}>
                      {i + 1}
                    </div>
                    <span style={{fontSize:'0.9rem', paddingTop:'2px'}}>{action}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{padding:'1rem', backgroundColor:'rgba(16,185,129,0.06)', borderRadius:'8px', border:'1px solid rgba(16,185,129,0.2)'}}>
              <div style={{fontSize:'0.75rem', fontWeight:700, color:'var(--color-success)', marginBottom:'0.25rem'}}>📤 OUTPUT</div>
              <p style={{fontSize:'0.85rem', color:'var(--text-main)', margin:0}}>{step.output}</p>
            </div>
          </div>

          {/* Navigation */}
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <button 
              className="btn btn-outline" 
              disabled={activeStep === 0}
              onClick={() => setActiveStep(activeStep - 1)}
            >
              ← Previous Step
            </button>
            <button 
              className="btn btn-primary" 
              disabled={activeStep === STEPS.length - 1}
              onClick={() => setActiveStep(activeStep + 1)}
            >
              Next Step →
            </button>
          </div>
        </div>

        {/* Sidebar — Role Map */}
        <div>
          <div className="card" style={{marginBottom:'1.5rem'}}>
            <h3 style={{fontSize:'1rem', fontWeight:700, marginBottom:'1rem'}}>Role Responsibilities</h3>
            <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
              {[
                { role: 'Engineer', color: '#8B5CF6', steps: '1-2', desc: 'Templates & Products' },
                { role: 'Planner', color: '#3B82F6', steps: '3', desc: 'Monthly Schedule' },
                { role: 'Stores', color: '#F59E0B', steps: '4', desc: 'Material Readiness' },
                { role: 'Preparation', color: '#10B981', steps: '5', desc: 'Bulk Mixing' },
                { role: 'Operator', color: '#EF4444', steps: '6-7', desc: 'Production & OEE' },
                { role: 'Quality', color: '#06B6D4', steps: '8', desc: 'Reject Logging' },
                { role: 'FG Stores', color: '#F59E0B', steps: '9', desc: 'Finished Goods' },
                { role: 'Supervisor', color: '#6366F1', steps: '10', desc: 'Shift Review' },
                { role: 'Manager', color: '#1E293B', steps: '11', desc: 'Plant Overview' },
              ].map((r, i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:'0.75rem',
                  padding:'0.5rem 0.75rem', borderRadius:'8px',
                  backgroundColor: STEPS[activeStep].role === r.role ? 'rgba(79,70,229,0.08)' : 'transparent',
                  border: STEPS[activeStep].role === r.role ? '1px solid var(--color-primary)' : '1px solid transparent'
                }}>
                  <div style={{
                    width:'10px', height:'10px', borderRadius:'50%', backgroundColor: r.color, flexShrink:0
                  }}></div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.8rem', fontWeight:700}}>{r.role}</div>
                    <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>{r.desc}</div>
                  </div>
                  <span style={{fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600}}>Step {r.steps}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{fontSize:'1rem', fontWeight:700, marginBottom:'1rem'}}>System Status</h3>
            <div style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.85rem'}}>
                <span>Total Pages</span>
                <span style={{fontWeight:700}}>{STEPS.length}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.85rem'}}>
                <span style={{color:'var(--color-success)'}}>✅ Live & Working</span>
                <span style={{fontWeight:700, color:'var(--color-success)'}}>{STEPS.filter(s=>s.status==='live').length}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.85rem'}}>
                <span style={{color:'var(--color-warning)'}}>🔜 Coming Soon</span>
                <span style={{fontWeight:700, color:'var(--color-warning)'}}>{STEPS.filter(s=>s.status==='coming-soon').length}</span>
              </div>
              <div style={{marginTop:'1rem'}}>
                <div style={{fontSize:'0.7rem', fontWeight:600, color:'var(--text-muted)', marginBottom:'0.5rem'}}>COMPLETION</div>
                <div style={{width:'100%', height:'8px', backgroundColor:'var(--border-light)', borderRadius:'999px'}}>
                  <div style={{
                    width:`${(STEPS.filter(s=>s.status==='live').length / STEPS.length * 100)}%`,
                    height:'100%', backgroundColor:'var(--color-success)', borderRadius:'999px',
                    transition:'width 0.4s ease'
                  }}></div>
                </div>
                <div style={{fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.25rem', textAlign:'right'}}>
                  {Math.round(STEPS.filter(s=>s.status==='live').length / STEPS.length * 100)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
