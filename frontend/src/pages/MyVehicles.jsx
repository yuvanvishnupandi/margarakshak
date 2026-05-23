import { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'

const API = 'https://margarakshak-backend.onrender.com'

export default function MyVehicles() {
  const { success, error: showError } = useToast()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({
    plate_no: '', vehicle_model: '', vehicle_type: 'Car', owner_name: '', owner_type: 'Individual'
  })

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(u)
    if (u?.id) fetchVehicles(u.id)
    else setLoading(false)
  }, [])

  const fetchVehicles = async (id) => {
    try {
      const res = await fetch(`${API}/api/vehicles/citizen/${id}`)
      const data = await res.json()
      setVehicles(data.vehicles || [])
    } catch (e) { showError('Failed to load vehicles') }
    finally { setLoading(false) }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.plate_no.trim()) return showError('Plate number is required')
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/api/vehicles/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plate_no: form.plate_no.toUpperCase().trim(), citizen_id: user?.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      success('Vehicle registered successfully!')
      setForm({ plate_no: '', vehicle_model: '', vehicle_type: 'Car', owner_name: '', owner_type: 'Individual' })
      setShowForm(false)
      fetchVehicles(user.id)
    } catch (e) { showError(e.message) }
    finally { setSubmitting(false) }
  }

  const typeColors = { Car:'#3b82f6', Motorcycle:'#f59e0b', Truck:'#ef4444', Bus:'#8b5cf6', 'Auto-Rickshaw':'#10b981', Bicycle:'#06b6d4', Other:'#6b7280' }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', paddingTop:'120px', paddingBottom:'40px' }}>
      <div style={{ maxWidth:'960px', margin:'0 auto', padding:'0 24px' }}>

        {/* Header */}
        <div style={{ marginBottom:'28px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'16px' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
              <div style={{ width:'4px', height:'20px', background:'#3b82f6', borderRadius:'2px' }}/>
              <span style={{ fontSize:'11px', fontWeight:700, color:'#3b82f6', letterSpacing:'1.2px', textTransform:'uppercase' }}>My Vehicles</span>
            </div>
            <h1 style={{ fontSize:'28px', fontWeight:800, color:'var(--text-primary)', margin:0 }}>Registered Vehicles</h1>
            <p style={{ color:'var(--text-secondary)', fontSize:'14px', margin:'6px 0 0' }}>Manage vehicles linked to your citizen account</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            padding:'10px 20px', background:'#3b82f6', color:'#fff', border:'none',
            borderRadius:'10px', fontWeight:700, fontSize:'14px', cursor:'pointer',
            display:'flex', alignItems:'center', gap:'8px', transition:'all 0.2s'
          }}
            onMouseEnter={e => e.currentTarget.style.background='#2563eb'}
            onMouseLeave={e => e.currentTarget.style.background='#3b82f6'}
          >
            <span style={{ fontSize:'18px' }}>+</span> Register Vehicle
          </button>
        </div>

        {/* Registration Form */}
        {showForm && (
          <div style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #e2e8f0', padding:'28px', marginBottom:'24px', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize:'16px', fontWeight:700, color:'#0f172a', margin:'0 0 20px' }}>Register New Vehicle</h2>
            <form onSubmit={handleRegister}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                {[
                  { label:'Plate Number *', key:'plate_no', placeholder:'e.g. TN01AB1234', upper:true },
                  { label:'Vehicle Model', key:'vehicle_model', placeholder:'e.g. Honda City' },
                  { label:'Owner Name', key:'owner_name', placeholder:'As per RC book' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize:'12px', fontWeight:600, color:'#64748b', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px' }}>{f.label}</label>
                    <input
                      value={form[f.key]} required={f.label.includes('*')}
                      onChange={e => setForm(p => ({ ...p, [f.key]: f.upper ? e.target.value.toUpperCase() : e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box', background:'var(--bg-primary)', color:'var(--text-primary)' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize:'12px', fontWeight:600, color:'#64748b', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Vehicle Type</label>
                  <select value={form.vehicle_type} onChange={e => setForm(p => ({ ...p, vehicle_type: e.target.value }))}
                    style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:'8px', fontSize:'14px', outline:'none', background:'var(--bg-primary)', color:'var(--text-primary)' }}>
                    {['Car','Motorcycle','Truck','Bus','Auto-Rickshaw','Bicycle','Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:600, color:'#64748b', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Owner Type</label>
                  <select value={form.owner_type} onChange={e => setForm(p => ({ ...p, owner_type: e.target.value }))}
                    style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:'8px', fontSize:'14px', outline:'none', background:'var(--bg-primary)', color:'var(--text-primary)' }}>
                    {['Individual','Corporate','Government'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:'12px', marginTop:'20px' }}>
                <button type="submit" disabled={submitting} style={{
                  padding:'10px 24px', background: submitting ? '#93c5fd' : '#3b82f6', color:'#fff',
                  border:'none', borderRadius:'8px', fontWeight:700, fontSize:'14px', cursor: submitting ? 'not-allowed' : 'pointer'
                }}>{submitting ? 'Registering…' : 'Register Vehicle'}</button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding:'10px 24px', background:'#f1f5f9', color:'#475569',
                  border:'1.5px solid #e2e8f0', borderRadius:'8px', fontWeight:600, fontSize:'14px', cursor:'pointer'
                }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Vehicles List */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px', color:'#94a3b8' }}>Loading your vehicles…</div>
        ) : vehicles.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #e2e8f0', padding:'60px', textAlign:'center' }}>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>🚗</div>
            <h3 style={{ fontSize:'18px', fontWeight:700, color:'#0f172a', margin:'0 0 8px' }}>No Vehicles Registered</h3>
            <p style={{ color:'#64748b', fontSize:'14px', margin:'0 0 20px' }}>Register your vehicle to link it to your citizen account.</p>
            <button onClick={() => setShowForm(true)} style={{ padding:'10px 24px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:'8px', fontWeight:700, fontSize:'14px', cursor:'pointer' }}>Register Now</button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'16px' }}>
            {vehicles.map(v => (
              <div key={v.plate_no} style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #e2e8f0', padding:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)' }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
                  <div style={{ background:'#f0f9ff', border:'1.5px solid #bae6fd', borderRadius:'8px', padding:'6px 12px' }}>
                    <span style={{ fontSize:'15px', fontWeight:800, fontFamily:'monospace', color:'#0369a1', letterSpacing:'1px' }}>{v.plate_no}</span>
                  </div>
                  <span style={{ fontSize:'11px', fontWeight:700, padding:'4px 10px', borderRadius:'999px', background: typeColors[v.vehicle_type] + '18', color: typeColors[v.vehicle_type], border:`1px solid ${typeColors[v.vehicle_type]}33` }}>{v.vehicle_type}</span>
                </div>
                <p style={{ margin:'0 0 4px', fontSize:'15px', fontWeight:700, color:'#0f172a' }}>{v.vehicle_model || 'Unknown Model'}</p>
                <p style={{ margin:'0 0 12px', fontSize:'13px', color:'#64748b' }}>{v.owner_name} · {v.owner_type}</p>
                <p style={{ margin:0, fontSize:'11px', color:'#94a3b8' }}>Registered {new Date(v.registered_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
