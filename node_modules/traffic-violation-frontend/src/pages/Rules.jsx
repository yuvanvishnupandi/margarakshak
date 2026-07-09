import { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'

import { API_BASE_URL } from '../config';
const API = API_BASE_URL;

const SEED_RULES = [
  { rule_id:'s1', rule_code:'MV Act §112', rule_name:'Over Speeding (LMV)', description:'Driving a Light Motor Vehicle beyond the prescribed speed limit on public roads.', base_fine_amount:1000, severity:'Moderate', violation_time:'Anytime', category:'Speeding' },
  { rule_id:'s2', rule_code:'MV Act §112(2)', rule_name:'Over Speeding (HMV)', description:'Driving a Heavy Motor Vehicle beyond the prescribed speed limit. Repeat offenders face licence suspension.', base_fine_amount:2000, severity:'Major', violation_time:'Anytime', category:'Speeding' },
  { rule_id:'s3', rule_code:'MV Act §183', rule_name:'Dangerous Driving', description:'Driving in a manner dangerous to the public including reckless overtaking, weaving, or road rage.', base_fine_amount:5000, severity:'Critical', violation_time:'Anytime', category:'Speeding' },
  { rule_id:'s4', rule_code:'MV Act §184', rule_name:'Driving Under Influence (DUI)', description:'Driving under the influence of alcohol (>30 mg/100 ml blood) or drugs. First offence: ₹10,000 and/or 6 months imprisonment.', base_fine_amount:10000, severity:'Critical', violation_time:'Anytime', category:'DUI' },
  { rule_id:'s5', rule_code:'MV Act §185', rule_name:'Drunk Driving — Repeat Offence', description:'Second or subsequent DUI offence within 3 years: ₹15,000 and/or 2 years imprisonment.', base_fine_amount:15000, severity:'Critical', violation_time:'Anytime', category:'DUI' },
  { rule_id:'s6', rule_code:'MV Act §129', rule_name:'No Helmet (Two-Wheeler)', description:'Rider or pillion not wearing a helmet conforming to BIS standards. Licence suspended for 3 months.', base_fine_amount:1000, severity:'Moderate', violation_time:'Anytime', category:'Safety' },
  { rule_id:'s7', rule_code:'MV Act §194B', rule_name:'No Seat Belt', description:'Driver or front-seat passenger not wearing seat belt while the vehicle is in motion.', base_fine_amount:1000, severity:'Minor', violation_time:'Anytime', category:'Safety' },
  { rule_id:'s8', rule_code:'MV Act §177', rule_name:'Red Light Jumping', description:'Crossing a stop line or traffic signal displaying a red light. Repeat: ₹5,000 + 1 year suspension.', base_fine_amount:1000, severity:'Major', violation_time:'Anytime', category:'Safety' },
  { rule_id:'s9', rule_code:'MV Act §122', rule_name:'Wrong-Side Driving', description:'Driving against the flow of traffic or on the wrong side of a divided road.', base_fine_amount:5000, severity:'Major', violation_time:'Anytime', category:'Safety' },
  { rule_id:'s10', rule_code:'MV Act §184(f)', rule_name:'Using Mobile Phone While Driving', description:'Using a handheld mobile device while operating a motor vehicle.', base_fine_amount:5000, severity:'Major', violation_time:'Anytime', category:'Safety' },
  { rule_id:'s11', rule_code:'MV Act §130', rule_name:'No Driving Licence', description:'Driving a motor vehicle without holding a valid driving licence for that class of vehicle.', base_fine_amount:5000, severity:'Major', violation_time:'Anytime', category:'Documents' },
  { rule_id:'s12', rule_code:'MV Act §196', rule_name:'No Insurance', description:'Using or permitting use of a motor vehicle without a valid third-party insurance policy.', base_fine_amount:2000, severity:'Major', violation_time:'Anytime', category:'Documents' },
  { rule_id:'s13', rule_code:'MV Act §192', rule_name:'No Registration Certificate', description:'Driving a motor vehicle not registered with the competent authority under the MV Act.', base_fine_amount:5000, severity:'Major', violation_time:'Anytime', category:'Documents' },
  { rule_id:'s14', rule_code:'MV Act §179', rule_name:'Disobeying Traffic Officer', description:'Refusing to comply with a direction or signal given by an authorised traffic police officer.', base_fine_amount:2000, severity:'Moderate', violation_time:'Anytime', category:'Safety' },
  { rule_id:'s15', rule_code:'MV Act §194(1)', rule_name:'Overloading (Passengers)', description:'Carrying passengers beyond the registered seating capacity of the vehicle.', base_fine_amount:1000, severity:'Moderate', violation_time:'Anytime', category:'Overloading' },
  { rule_id:'s16', rule_code:'MV Act §194(2)', rule_name:'Overloading (Goods)', description:'Carrying goods beyond the registered gross vehicle weight. Fine: ₹2,000 + ₹1,000 per tonne excess.', base_fine_amount:2000, severity:'Moderate', violation_time:'Anytime', category:'Overloading' },
  { rule_id:'s17', rule_code:'MV Act §177A', rule_name:'Violation of Road Regulations', description:'Violation of rules related to road signs, road markings, and other notified traffic regulations.', base_fine_amount:500, severity:'Minor', violation_time:'Anytime', category:'Safety' },
  { rule_id:'s18', rule_code:'MV Act §206', rule_name:'Licence Suspended — Still Driving', description:'Driving after a disqualification order or suspension of driving licence.', base_fine_amount:10000, severity:'Critical', violation_time:'Anytime', category:'Documents' },
  { rule_id:'s19', rule_code:'MV Act §194C', rule_name:'Not Giving Way to Emergency Vehicle', description:'Failing to give way to an ambulance, fire engine, or other emergency vehicle sounding a siren.', base_fine_amount:10000, severity:'Critical', violation_time:'Anytime', category:'Safety' },
  { rule_id:'s20', rule_code:'MV Act §194D', rule_name:'No Reflectors / Faulty Lights', description:'Driving without mandatory reflectors, indicators, or with non-functional lights during night.', base_fine_amount:500, severity:'Minor', violation_time:'Nighttime', category:'Equipment' },
  { rule_id:'s21', rule_code:'MV Act §190(2)', rule_name:'Vehicle in Unsafe Condition', description:'Using a vehicle whose condition is dangerous to road users — defective brakes, tyres, or steering.', base_fine_amount:5000, severity:'Major', violation_time:'Anytime', category:'Equipment' },
  { rule_id:'s22', rule_code:'MV Act §122A', rule_name:'Illegal Parking', description:'Parking a vehicle in a no-parking zone, near a fire hydrant, on a footpath, or obstructing traffic.', base_fine_amount:500, severity:'Minor', violation_time:'Anytime', category:'Parking' },
  { rule_id:'s23', rule_code:'MV Act §171', rule_name:'Misuse of Horn', description:'Using a multi-toned horn, air horn, or horn in a silence zone such as near hospitals or schools.', base_fine_amount:1000, severity:'Minor', violation_time:'Anytime', category:'Equipment' },
  { rule_id:'s24', rule_code:'MV Act §182A', rule_name:'Unauthorised Vehicle Modification', description:'Altering vehicle structure, colour, or engine not as per the registration certificate or without RTO approval.', base_fine_amount:5000, severity:'Moderate', violation_time:'Anytime', category:'Equipment' },
  { rule_id:'s25', rule_code:'MV Act §119', rule_name:'Jumping Lane / No Lane Discipline', description:'Changing lanes without signal, straddling lanes, or not following lane markings on multi-lane roads.', base_fine_amount:500, severity:'Minor', violation_time:'Anytime', category:'Safety' },
  { rule_id:'s26', rule_code:'MV Act §180', rule_name:'Allowing Unlicensed Person to Drive', description:'Owner of a vehicle permitting a person without a valid licence to drive it. Owner is equally liable for the offence.', base_fine_amount:5000, severity:'Major', violation_time:'Anytime', category:'Documents' },
  { rule_id:'s27', rule_code:'MV Act §181', rule_name:'Driving Without Authority', description:'Driving a vehicle without the consent of the owner or other lawful authority — including unauthorised use of government or official vehicles.', base_fine_amount:5000, severity:'Major', violation_time:'Anytime', category:'Documents' },
  { rule_id:'s28', rule_code:'MV Act §183A', rule_name:'Racing / Speed Trial on Public Road', description:'Participating in or organising any race or speed trial on a public road without written permission of the competent authority.', base_fine_amount:5000, severity:'Critical', violation_time:'Anytime', category:'Speeding' },
  { rule_id:'s29', rule_code:'MV Act §194A', rule_name:'Overloading Passengers on Two-Wheeler', description:'Carrying more than one pillion rider on a two-wheeled motor vehicle, or seating a passenger in an unsafe manner.', base_fine_amount:2000, severity:'Moderate', violation_time:'Anytime', category:'Overloading' },
  { rule_id:'s30', rule_code:'MV Act §194E', rule_name:'Failing to Give Way to School Bus', description:'Not stopping or giving right-of-way to a school bus while it is loading or unloading children at a designated school bus stop.', base_fine_amount:10000, severity:'Critical', violation_time:'Daytime', category:'Safety' },
  { rule_id:'s31', rule_code:'MV Act §197', rule_name:'Taking Vehicle Without Owner\'s Consent', description:'Taking or driving a motor vehicle on a public road without the consent of the owner, even temporarily.', base_fine_amount:5000, severity:'Major', violation_time:'Anytime', category:'Documents' },
  { rule_id:'s32', rule_code:'MV Act §201', rule_name:'Leaving Vehicle in Dangerous Position', description:'Leaving a motor vehicle stationary on a road in a position or condition that is dangerous to other road users without adequate warning.', base_fine_amount:1000, severity:'Moderate', violation_time:'Anytime', category:'Parking' },
  { rule_id:'s33', rule_code:'MV Act §204', rule_name:'Failure to Stop When Signalled by Police', description:'Refusing to stop or continuing to drive when directed to stop by a uniformed police officer or traffic authority.', base_fine_amount:5000, severity:'Major', violation_time:'Anytime', category:'Safety' },
  { rule_id:'s34', rule_code:'MV Act §134', rule_name:'Duty of Driver After Accident', description:'Driver involved in an accident failing to stop, render assistance to the injured, or report the incident to the nearest police station.', base_fine_amount:10000, severity:'Critical', violation_time:'Anytime', category:'Safety' },
  { rule_id:'s35', rule_code:'MV Act §211', rule_name:'No PUC Certificate (Pollution)', description:'Using a motor vehicle without a valid Pollution Under Control (PUC) certificate as mandated by the Central Motor Vehicles Rules.', base_fine_amount:10000, severity:'Major', violation_time:'Anytime', category:'Equipment' },
  { rule_id:'s36', rule_code:'MV Act §177C', rule_name:'Tinted Windows Beyond Permissible Limit', description:'Applying tinted film on windscreen or windows with Visual Light Transmittance (VLT) below the prescribed limits (70% front, 50% rear).', base_fine_amount:1000, severity:'Minor', violation_time:'Anytime', category:'Equipment' },
  { rule_id:'s37', rule_code:'MV Act §190(1)', rule_name:'Using Vehicle with Defective Exhaust / Smoke', description:'Using a vehicle emitting excessive smoke, noxious gases, or noise beyond the prescribed environmental and noise standards.', base_fine_amount:2000, severity:'Moderate', violation_time:'Anytime', category:'Equipment' },
  { rule_id:'s38', rule_code:'MV Act §114', rule_name:'Invalid / Tampered Registration Plate', description:'Using a vehicle with a registration mark that does not conform to prescribed standards, is obscured, or has been tampered with.', base_fine_amount:5000, severity:'Moderate', violation_time:'Anytime', category:'Documents' },
  { rule_id:'s39', rule_code:'MV Act §126', rule_name:'Carrying Children Without Safety Seat', description:'Transporting a child below four years of age in a motor vehicle without an approved child safety seat or restraint system.', base_fine_amount:1000, severity:'Moderate', violation_time:'Anytime', category:'Safety' },
  { rule_id:'s40', rule_code:'MV Act §119A', rule_name:'Failure to Use Indicators / Turn Signals', description:'Turning, changing lanes, or manoeuvring without using the mandatory direction indicator signals.', base_fine_amount:500, severity:'Minor', violation_time:'Anytime', category:'Safety' },
  { rule_id:'s41', rule_code:'MV Act §177B', rule_name:'Violation of Environmental Noise Standards', description:'Operating a vehicle that generates noise levels exceeding prescribed decibel limits, particularly in silence zones near schools and hospitals.', base_fine_amount:1000, severity:'Minor', violation_time:'Anytime', category:'Equipment' },
  { rule_id:'s42', rule_code:'MV Act §199A', rule_name:'Guardian Liable for Minor Driving', description:'Guardian or owner held liable when a motor vehicle is driven by a person under 18 years of age. Punishable with imprisonment up to 3 years.', base_fine_amount:25000, severity:'Critical', violation_time:'Anytime', category:'Documents' },
  { rule_id:'s43', rule_code:'MV Act §128', rule_name:'No Footwear While Driving Two-Wheeler', description:'Riding a two-wheeled motor vehicle without wearing proper footwear, which constitutes a safety risk in the event of a fall.', base_fine_amount:500, severity:'Minor', violation_time:'Anytime', category:'Safety' },
  { rule_id:'s44', rule_code:'MV Act §177D', rule_name:'Using High Beam in Oncoming Traffic', description:'Driving with high-beam headlights turned on when oncoming vehicles are within range, causing temporary blindness to other drivers.', base_fine_amount:500, severity:'Minor', violation_time:'Nighttime', category:'Safety' },
  { rule_id:'s45', rule_code:'MV Act §132', rule_name:'Riding Without Valid Fitness Certificate', description:'Plying a transport vehicle on a public road without a valid fitness certificate issued by the appropriate authority under the MV Act.', base_fine_amount:5000, severity:'Major', violation_time:'Anytime', category:'Documents' },
]

function Rules() {
  const { success, error: showError } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState(null)
  const [editFine, setEditFine] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRule, setNewRule] = useState({ rule_code:'', rule_name:'', description:'', base_fine_amount:'', severity:'Minor', violation_time:'Anytime', is_active:true })

  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isPolice = user?.role === 'police'
  const categories = ['All','Safety','Documents','Speeding','DUI','Parking','Equipment','Overloading']

  const deriveCategory = (rule) => {
    if (rule.category) return rule.category
    const n = (rule.rule_name || '').toLowerCase()
    const c = (rule.rule_code || '').toLowerCase()
    if (n.includes('speed') || n.includes('racing'))                                      return 'Speeding'
    if (n.includes('drunk') || n.includes('dui') || n.includes('alcohol') || c.includes('185') || (c.includes('184') && !n.includes('mobile'))) return 'DUI'
    if (n.includes('parking') || n.includes('dangerous position'))                        return 'Parking'
    if (n.includes('overload'))                                                            return 'Overloading'
    if (n.includes('horn') || n.includes('exhaust') || n.includes('reflector') ||
        n.includes('modification') || n.includes('tinted') || n.includes('pollution') ||
        n.includes('unsafe condition') || n.includes('noise standard') || n.includes('faulty light') || n.includes('puc')) return 'Equipment'
    if (n.includes('licence') || n.includes('license') || n.includes('insurance') ||
        n.includes('registr') || n.includes('fitness') || n.includes('suspended') ||
        n.includes('unlicensed') || n.includes('consent') || n.includes('plate') ||
        n.includes('tamper') || n.includes('minor driving') || n.includes('guardian') ||
        n.includes('without authority'))                                                   return 'Documents'
    return 'Safety'
  }

  useEffect(() => { fetchRules() }, [])

  const fetchRules = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/rules/all`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const dbRules = (data.rules || []).map(r => ({ ...r, category: deriveCategory(r) }))
      setRules(dbRules.length > 0 ? dbRules : SEED_RULES)
    } catch {
      setRules(SEED_RULES)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateFine = async (ruleId) => {
    if (String(ruleId).startsWith('s')) { showError('Seed rule — save to DB first via Create Rule'); return }
    try {
      const res = await fetch(`${API_BASE_URL}/api/rules/${ruleId}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ base_fine_amount:parseFloat(editFine) }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail||'Update failed') }
      success('Fine updated'); setEditingRule(null); setEditFine(''); fetchRules()
    } catch(err) { showError(err.message) }
  }

  const handleDeleteRule = async (ruleId) => {
    if (String(ruleId).startsWith('s')) { showError('Cannot delete seed rule'); return }
    if (!confirm('Delete this rule?')) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/rules/${ruleId}`, { method:'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail||'Delete failed') }
      success('Rule deleted'); fetchRules()
    } catch(err) { showError(err.message) }
  }

  const handleCreateRule = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE_URL}/api/rules/create`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...newRule, base_fine_amount:parseFloat(newRule.base_fine_amount) }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail||'Create failed') }
      success('Rule created successfully')
      setShowAddForm(false)
      setNewRule({ rule_code:'', rule_name:'', description:'', base_fine_amount:'', severity:'Minor', violation_time:'Anytime', is_active:true })
      fetchRules()
    } catch(err) { showError(err.message) }
  }

  const filteredRules = rules.filter(r => {
    const q = searchTerm.toLowerCase()
    const matchSearch = r.rule_name?.toLowerCase().includes(q) || r.rule_code?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
    const matchCat = activeCategory === 'All' || r.category === activeCategory
    return matchSearch && matchCat
  })

  const severityColor = (s) => ({ Critical:'#ef4444', Major:'#f97316', Moderate:'#eab308', Minor:'#22c55e' }[s] || '#6b7280')
  const severityBg = (s) => ({ Critical:'#fef2f2', Major:'var(--bg-card)7ed', Moderate:'#fefce8', Minor:'#f0fdf4' }[s] || 'var(--bg-primary)')
  const fineColor = (f) => f >= 10000 ? '#ef4444' : f >= 5000 ? '#f97316' : f >= 1000 ? '#eab308' : '#22c55e'

  const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm'

  if (loading) return (
    <div style={{ background: 'var(--bg-secondary)' }} className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"/>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Loading traffic rules…</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', paddingTop:'96px' }}>
      <div style={{ maxWidth:'1440px', margin:'0 auto', padding:'0 32px 64px' }}>

        {}
        <div style={{ marginBottom:'32px' }}>
          <span style={{ display:'inline-block', padding:'4px 14px', background:'#eff6ff', color:'#1d4ed8', fontSize:'11px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', borderRadius:'999px', marginBottom:'12px' }}>
            Motor Vehicles Act 1988 · Amended 2019
          </span>
          <h1 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:900, color:'var(--text-primary)', margin:'0 0 8px', letterSpacing:'-0.5px' }}>Traffic Rules &amp; Penalties</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'15px', margin:0 }}>Official fine schedule — Indian Motor Vehicles Act. Sourced from MoRTH, Government of India.</p>
        </div>

        {}
        {isPolice && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'24px' }}>
            <button onClick={() => setShowAddForm(!showAddForm)} style={{
              display:'inline-flex', alignItems:'center', gap:'8px',
              padding:'12px 28px', borderRadius:'999px',
              background: showAddForm ? '#dc2626' : '#1e3a8a',
              color:'var(--bg-card)', fontWeight:700, fontSize:'14px', border:'none',
              cursor:'pointer', boxShadow:'0 4px 16px rgba(30,58,138,0.25)',
              transition:'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}
            >
              {showAddForm ? (
                <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancel</>
              ) : (
                <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add New Law</>
              )}
            </button>
          </div>
        )}

        {}
        {isPolice && showAddForm && (
          <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)', borderRadius:'20px', padding:'32px', marginBottom:'28px', boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize:'18px', fontWeight:800, color:'var(--text-primary)', marginBottom:'24px' }}>Create New Traffic Rule</h3>
            <form onSubmit={handleCreateRule}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:700, color: 'var(--text-secondary)', marginBottom:'6px' }}>Rule Code</label>
                  <input className={inputCls} placeholder="e.g., MV Act §207" value={newRule.rule_code} onChange={e=>setNewRule({...newRule,rule_code:e.target.value})} required/>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:700, color: 'var(--text-secondary)', marginBottom:'6px' }}>Rule Name</label>
                  <input className={inputCls} placeholder="e.g., Illegal U-Turn" value={newRule.rule_name} onChange={e=>setNewRule({...newRule,rule_name:e.target.value})} required/>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:700, color: 'var(--text-secondary)', marginBottom:'6px' }}>Description</label>
                  <textarea className={inputCls} rows={2} placeholder="Describe the violation..." value={newRule.description} onChange={e=>setNewRule({...newRule,description:e.target.value})} required/>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:700, color: 'var(--text-secondary)', marginBottom:'6px' }}>Fine Amount (₹)</label>
                  <input type="number" className={inputCls} placeholder="1000" value={newRule.base_fine_amount} onChange={e=>setNewRule({...newRule,base_fine_amount:e.target.value})} required/>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:700, color: 'var(--text-secondary)', marginBottom:'6px' }}>Severity</label>
                  <select className={inputCls} value={newRule.severity} onChange={e=>setNewRule({...newRule,severity:e.target.value})}>
                    {['Minor','Moderate','Major','Critical'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:700, color: 'var(--text-secondary)', marginBottom:'6px' }}>Category</label>
                  <select className={inputCls} value={newRule.category||''} onChange={e=>setNewRule({...newRule,category:e.target.value})}>
                    {['Safety','Documents','Speeding','DUI','Parking','Equipment','Overloading'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:700, color: 'var(--text-secondary)', marginBottom:'6px' }}>Violation Time</label>
                  <select className={inputCls} value={newRule.violation_time} onChange={e=>setNewRule({...newRule,violation_time:e.target.value})}>
                    {['Anytime','Daytime','Nighttime'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" style={{ padding:'12px 32px', background:'#1e3a8a', color:'var(--bg-card)', fontWeight:700, fontSize:'14px', border:'none', borderRadius:'999px', cursor:'pointer', boxShadow:'0 4px 12px rgba(30,58,138,0.22)', transition:'all 0.2s' }}>
                Create Rule
              </button>
            </form>
          </div>
        )}

        {}
        <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)', borderRadius:'16px', padding:'20px 24px', marginBottom:'28px', display:'flex', flexWrap:'wrap', gap:'16px', alignItems:'center' }}>
          <div style={{ flex:1, minWidth:'200px', position:'relative' }}>
            <svg style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--text-secondary)' }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Search by rule name, code or keyword…" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
              style={{ width:'100%', padding:'10px 12px 10px 38px', border:'1.5px solid var(--border)', borderRadius:'10px', fontSize:'13px', outline:'none', background:'var(--bg-primary)', boxSizing:'border-box' }}/>
          </div>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {categories.map(c => (
              <button key={c} onClick={()=>setActiveCategory(c)} style={{
                padding:'7px 16px', borderRadius:'999px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:600, transition:'all 0.15s',
                background: activeCategory===c ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: activeCategory===c ? 'var(--bg-card)' : 'var(--text-secondary)',
              }}>{c}</button>
            ))}
          </div>
        </div>

        {}
        <p style={{ color:'var(--text-secondary)', fontSize:'12px', marginBottom:'16px' }}>{filteredRules.length} rule{filteredRules.length!==1?'s':''} found</p>

        {}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(400px,1fr))', gap:'20px' }}>
          {filteredRules.map(rule => (
            <div key={rule.rule_id} style={{
              background:'var(--bg-card)', border:'1.5px solid var(--border)', borderRadius:'18px', padding:'24px',
              transition:'all 0.25s', boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
            }}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 28px rgba(0,0,0,0.10)';e.currentTarget.style.transform='translateY(-3px)'}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)';e.currentTarget.style.transform='translateY(0)'}}
            >
              {}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                <span style={{ fontSize:'11px', fontWeight:700, color:'var(--text-secondary)', background:'var(--bg-secondary)', padding:'3px 10px', borderRadius:'999px' }}>{rule.rule_code}</span>
                <span style={{ fontSize:'11px', fontWeight:700, color:severityColor(rule.severity), background:severityBg(rule.severity), padding:'3px 10px', borderRadius:'999px' }}>{rule.severity}</span>
              </div>

              <h3 style={{ fontSize:'16px', fontWeight:800, color:'var(--text-primary)', margin:'0 0 8px' }}>{rule.rule_name}</h3>
              <p style={{ fontSize:'13px', color:'var(--text-secondary)', lineHeight:1.6, margin:'0 0 16px' }}>{rule.description}</p>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid var(--bg-secondary)', paddingTop:'14px' }}>
                <div>
                  {editingRule === rule.rule_id ? (
                    <div style={{ display:'flex', gap:'8px' }}>
                      <input type="number" value={editFine} onChange={e=>setEditFine(e.target.value)} placeholder="Fine ₹"
                        style={{ width:'100px', padding:'6px 10px', border:'1.5px solid #cbd5e1', borderRadius:'8px', fontSize:'13px', outline:'none' }}/>
                      <button onClick={()=>handleUpdateFine(rule.rule_id)} style={{ padding:'6px 14px', background:'#16a34a', color:'var(--bg-card)', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>Save</button>
                      <button onClick={()=>{setEditingRule(null);setEditFine('')}} style={{ padding:'6px 12px', background:'var(--bg-secondary)', color: 'var(--text-secondary)', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <span style={{ fontSize:'22px', fontWeight:900, color:fineColor(rule.base_fine_amount) }}>₹{rule.base_fine_amount?.toLocaleString('en-IN')}</span>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontSize:'11px', color:'var(--text-secondary)', background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'999px', padding:'3px 10px' }}>{rule.category||'General'}</span>
                  {isPolice && editingRule !== rule.rule_id && (
                    <>
                      <button onClick={()=>{setEditingRule(rule.rule_id);setEditFine(rule.base_fine_amount)}} style={{ padding:'5px 12px', background:'var(--bg-card)7ed', color:'#c2410c', border:'1px solid #fed7aa', borderRadius:'8px', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>Edit</button>
                      <button onClick={()=>handleDeleteRule(rule.rule_id)} style={{ padding:'5px 12px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:'8px', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>Del</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRules.length === 0 && (
          <div style={{ textAlign:'center', padding:'80px 0', color:'var(--text-secondary)' }}>
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin:'0 auto 16px' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <p style={{ fontSize:'16px', fontWeight:600 }}>No rules match your search</p>
            <p style={{ fontSize:'13px', marginTop:'6px' }}>Try a different keyword or category</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Rules
