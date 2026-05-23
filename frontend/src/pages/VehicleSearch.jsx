import { useState, useEffect } from 'react'

const API_BASE_URL = 'http://localhost:5000'

// Example plates known to be in the database
const EXAMPLE_PLATES = [
  { plate: 'TN02YY2222', label: 'Has violations' },
  { plate: 'TN63XX4444', label: 'Registered' },
  { plate: 'TN02YY1111', label: 'Registered' },
]

const STEPS = [
  { num: '1', title: 'Enter Plate Number', desc: 'Type the vehicle registration number in the search box above. Use the official format, e.g. TN02YY2222.' },
  { num: '2', title: 'View Registration Details', desc: 'Owner name, vehicle type, model, and registration date are pulled from the official database instantly.' },
  { num: '3', title: 'Check Violation History', desc: 'All challan records linked to this vehicle are shown — including fine amount, severity, and current payment status.' },
  { num: '4', title: 'Take Action', desc: 'If unpaid challans exist, the vehicle owner can log in to the citizen portal and pay them directly from My Challans.' },
]

const statusStyle = (s) => {
  const m = { Unpaid: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }, Paid: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }, Overdue: { background: '#ffedd5', color: '#9a3412', border: '1px solid #fdba74' } }
  return m[s] || { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }
}

const severityStyle = (s) => {
  const m = { Minor: { background: '#f0fdf4', color: '#166534', border: '1px solid #86efac' }, Moderate: { background: '#fefce8', color: '#854d0e', border: '1px solid #fde047' }, Major: { background: '#ffedd5', color: '#9a3412', border: '1px solid #fdba74' }, Critical: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5' } }
  return m[s] || { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }
}

function Field({ label, value, mono }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 18px' }}>
      <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', fontFamily: mono ? 'monospace' : 'inherit' }}>{value || '—'}</p>
    </div>
  )
}

function VehicleSearch() {
  const [plateNo, setPlateNo] = useState('')
  const [vehicle, setVehicle] = useState(null)
  const [violations, setViolations] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [parivahan, setParivahan] = useState(null)
  const [parivahanLoading, setParivahanLoading] = useState(false)
  const [allRules, setAllRules] = useState([])
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [issueData, setIssueData] = useState({ rule_id: '', notes: '' })
  
  const authUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isCop = authUser.role === 'police'

  useEffect(() => {
    if (isCop) fetchRules()
  }, [isCop])

  const fetchRules = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rules/all`)
      const data = await res.json()
      if (data.success) setAllRules(data.rules)
    } catch (_) {}
  }

  const doSearch = async (plate) => {
    const q = plate.trim().toUpperCase()
    if (!q) { setError('Please enter a plate number'); return }
    setLoading(true); setError(''); setVehicle(null); setViolations([]); setSummary(null); setParivahan(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/vehicles/search/${q}`)
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Vehicle not found') }
      const data = await res.json()
      setVehicle(data.vehicle); setViolations(data.violations); setSummary(data.summary)
      // Auto-fetch Parivahan data in parallel
      fetchParivahan(q)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const fetchParivahan = async (plate) => {
    setParivahanLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/weather/vehicle?plate=${plate}`)
      const data = await res.json()
      if (res.ok && data.success) setParivahan(data)
    } catch (_) {}
    finally { setParivahanLoading(false) }
  }

  const handleSubmit = (e) => { e.preventDefault(); doSearch(plateNo) }
  const handleExample = (plate) => { setPlateNo(plate); doSearch(plate) }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '100px 24px 60px', fontFamily: 'inherit' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Vehicle Intelligence</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>RTO Database Search — Authorized Police Access Only</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ecfdf5', border: '1px solid #10b981', padding: '8px 14px', borderRadius: '99px', boxShadow: '0 4px 6px rgba(16,185,129,0.1)' }}>
             <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 0 3px rgba(16,185,129,0.2)' }} />
             <span style={{ color: '#047857', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>MoRTH VAHAN DB Connected</span>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1.5px solid var(--border)', padding: '24px', marginBottom: '28px', boxShadow: 'var(--shadow-card)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={plateNo}
                onChange={e => setPlateNo(e.target.value.toUpperCase())}
                placeholder="Enter plate number — e.g. TN02YY2222"
                style={{ width: '100%', boxSizing: 'border-box', padding: '14px 18px', border: '1.5px solid var(--border)', borderRadius: '12px', fontSize: '15px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', outline: 'none', letterSpacing: '1px', background: 'var(--bg-primary)', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: '13px 32px', background: loading ? '#a5b4fc' : '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#4338ca' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#4f46e5' }}>
              {loading ? 'Querying VAHAN DB...' : 'Search Vehicle'}
            </button>
          </form>

          {/* Example Plates */}
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Try example:</span>
            {EXAMPLE_PLATES.map(({ plate, label }) => (
              <button key={plate} onClick={() => handleExample(plate)}
                style={{ padding: '4px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#4f46e5', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ede9fe'; e.currentTarget.style.borderColor = '#c4b5fd' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0' }}>
                {plate} <span style={{ color: '#94a3b8', fontFamily: 'sans-serif', fontWeight: 400 }}>· {label}</span>
              </button>
            ))}
          </div>

          {error && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: '#dc2626' }}>
              {error}
            </div>
          )}
        </div>

        {/* Not Found */}
        {error && !vehicle && plateNo && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '48px 24px', textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '52px', height: '52px', background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="22" height="22" fill="none" stroke="#dc2626" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Vehicle Not Found</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 6px' }}>No record for plate number:</p>
            <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '18px', color: '#4f46e5', margin: '0 0 10px' }}>{plateNo}</p>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Please verify the plate number and try again.</p>
          </div>
        )}

        {/* Vehicle Details */}
        {vehicle && (
          <>
            {/* Registration Card + Parivahan side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: (parivahan || parivahanLoading) ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '20px' }}>
              {/* DB Card */}
              <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>Vehicle & Owner Registration</h2>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Official details from Marga Rakshak database</p>
                  </div>
                  {isCop && (
                    <button 
                      onClick={() => setShowIssueModal(true)}
                      style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(220,38,38,0.2)' }}
                    >
                      Issue Direct Challan
                    </button>
                  )}
                </div>
                <div style={{ padding: '24px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registration Details</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <Field label="Plate Number" value={vehicle.plate_no} mono />
                    <Field label="Vehicle Type" value={vehicle.vehicle_type} />
                    <Field label="Make / Model" value={vehicle.vehicle_model} />
                    <Field label="Registered On" value={vehicle.registered_at ? new Date(vehicle.registered_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'} />
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Owner Details</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    <Field label="Owner Name" value={vehicle.owner_name} />
                    <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 18px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</p>
                      <span style={{ display: 'inline-block', padding: '3px 10px', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parivahan Card — auto-loads alongside DB results */}
              {parivahanLoading && (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                  <p style={{ color: '#7c3aed', fontWeight: 700, fontSize: '13px' }}>Fetching Parivahan data…</p>
                </div>
              )}
              {parivahan && (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1.5px solid #ede9fe', boxShadow: '0 1px 8px rgba(124,58,237,0.08)', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid #ede9fe', background: 'linear-gradient(135deg,#faf5ff,#ede9fe)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="18" height="18" fill="none" stroke="#7c3aed" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#4c1d95' }}>Parivahan Verification</h2>
                      <p style={{ margin: 0, fontSize: '11px', color: '#7c3aed' }}>MoRTH — Ministry of Road Transport & Highways</p>
                    </div>
                  </div>
                  <div style={{ padding: '20px 24px' }}>
                    <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicle Details</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                      {[
                        { label: 'Make & Model', value: `${parivahan.vehicle.make} ${parivahan.vehicle.model}` },
                        { label: 'Type', value: parivahan.vehicle.type },
                        { label: 'Color', value: parivahan.vehicle.color },
                        { label: 'Fuel', value: parivahan.vehicle.fuel_type },
                        { label: 'Year', value: parivahan.vehicle.year_of_manufacture },
                        { label: 'RTO', value: parivahan.registration.rto },
                      ].map((f, i) => (
                        <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #ede9fe', padding: '10px 14px' }}>
                          <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{f.label}</p>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#4c1d95' }}>{f.value}</p>
                        </div>
                      ))}
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Compliance Status</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      {[
                        { label: 'Insurance', value: parivahan.insurance.status, valid: parivahan.insurance.status === 'Valid' },
                        { label: 'Fitness', value: parivahan.fitness.status, valid: parivahan.fitness.status === 'Valid' },
                        { label: 'PUC', value: parivahan.pollution.status.includes('Valid') ? 'Valid' : 'Expired', valid: parivahan.pollution.status.includes('Valid') },
                      ].map((f, i) => (
                        <div key={i} style={{ borderRadius: '10px', padding: '12px', textAlign: 'center', background: f.valid ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${f.valid ? '#86efac' : '#fca5a5'}` }}>
                          <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{f.label}</p>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: f.valid ? '#16a34a' : '#dc2626' }}>{f.value}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ margin: '10px 0 0', fontSize: '10px', color: '#a78bfa' }}>Insurance: {parivahan.insurance.company} · valid till {parivahan.insurance.valid_until}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary Stats */}
            {summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                {[
                  { label: 'Total Violations', value: summary.total_violations, color: '#0f172a' },
                  { label: 'Unpaid Challans', value: summary.unpaid_challans, color: '#dc2626' },
                  { label: 'Total Unpaid Amount', value: `Rs. ${summary.total_unpaid_amount?.toFixed(2)}`, color: '#ea580c' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Violation History Table */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0' }}>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Violation History</h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Complete violation and challan records</p>
              </div>
              {violations.length === 0 ? (
                <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                  <div style={{ width: '52px', height: '52px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <svg width="22" height="22" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>Clean Record</h3>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No violations found for this vehicle.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '100px' }} />
                    <col />
                    <col style={{ width: '110px' }} />
                    <col style={{ width: '90px' }} />
                    <col style={{ width: '110px' }} />
                    <col style={{ width: '100px' }} />
                  </colgroup>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                      {['Date', 'Violation', 'Severity', 'Challan', 'Amount', 'Status'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.7px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {violations.map((v, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: '#fff', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <td style={{ padding: '14px 16px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {v.event_timestamp ? new Date(v.event_timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', overflow: 'hidden' }}>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.rule_name}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{v.rule_code}</p>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, ...severityStyle(v.severity) }}>{v.severity}</span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: '#4f46e5' }}>
                          {v.challan_id ? `#${v.challan_id}` : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                          Rs. {v.total_amount ? parseFloat(v.total_amount).toFixed(2) : parseFloat(v.base_fine_amount || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {v.challan_id ? (
                            <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, ...statusStyle(v.payment_status) }}>{v.payment_status}</span>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>No challan</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Default placeholder — no search yet */}
        {!vehicle && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '4px' }}>
            {/* How to Use */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>How to Use Vehicle Search</h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Follow these steps to look up any registered vehicle</p>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {STEPS.map(({ num, title, desc }) => (
                  <div key={num} style={{ display: 'flex', gap: '14px', marginBottom: num === '4' ? 0 : '18px' }}>
                    <div style={{ width: '30px', height: '30px', background: '#ede9fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#4f46e5' }}>{num}</span>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{title}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What You Get */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Information Displayed</h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>What the search result shows</p>
              </div>
              <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { title: 'Plate Number', desc: 'Official registration ID' },
                  { title: 'Vehicle Type & Model', desc: 'Car, bike, auto, etc.' },
                  { title: 'Owner Name', desc: 'Registered name in RTO' },
                  { title: 'Registration Date', desc: 'When the vehicle was registered' },
                  { title: 'Total Violations', desc: 'All time violation count' },
                  { title: 'Unpaid Challans', desc: 'Pending fine amounts' },
                  { title: 'Severity Levels', desc: 'Minor / Moderate / Major / Critical' },
                  { title: 'Payment Status', desc: 'Paid, Unpaid or Overdue' },
                ].map(({ title, desc }) => (
                  <div key={title} style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '12px 14px' }}>
                    <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{title}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Issue Challan Modal */}
        {showIssueModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '20px', maxWidth: '500px', width: '100%', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)', border:'1px solid var(--border)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>Issue Direct Citation</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Issuing on-spot challan for vehicle <span style={{ fontWeight: 800, color: 'var(--accent)', fontFamily: 'monospace' }}>{vehicle?.plate_no}</span></p>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Violation Type</label>
                <select 
                  value={issueData.rule_id} 
                  onChange={e => setIssueData({ ...issueData, rule_id: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1.5px solid var(--border)', borderRadius: '10px', fontSize: '14px', background: 'var(--bg-primary)', color:'var(--text-primary)' }}
                >
                  <option value="">Select violation type...</option>
                  {allRules.map(r => (
                    <option key={r.rule_id} value={r.rule_id}>{r.rule_name} (₹{r.base_fine_amount})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Officer's Notes / Location</label>
                <textarea 
                  value={issueData.notes}
                  onChange={e => setIssueData({ ...issueData, notes: e.target.value })}
                  placeholder="Describe the incident (e.g. Near Signal #4, Anna Salai)..."
                  rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px', border: '1.5px solid var(--border)', borderRadius: '10px', fontSize: '14px', background: 'var(--bg-primary)', color:'var(--text-primary)', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setShowIssueModal(false)}
                  style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (!issueData.rule_id) return alert('Select a violation');
                    const selectedRule = allRules.find(r => String(r.rule_id) === String(issueData.rule_id));
                    if (!selectedRule) return alert('Invalid rule selected');

                    try {
                      const res = await fetch(`${API_BASE_URL}/api/challans/direct-issue`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          plate_no: vehicle.plate_no,
                          rule_id: selectedRule.rule_id,
                          badge_no: authUser.badge_no || 'POL0001',
                          total_amount: selectedRule.base_fine_amount,
                          notes: issueData.notes
                        })
                      });
                      
                      const data = await res.json();
                      if (res.ok) {
                        alert('Challan issued successfully! ID: #' + (data.challan_id || 'N/A'));
                        setShowIssueModal(false);
                        setIssueData({ rule_id: '', notes: '' });
                        doSearch(vehicle.plate_no); // Refresh list
                      } else {
                        alert('Error: ' + (data.error || 'Failed to issue challan'));
                      }
                    } catch (err) { 
                      alert('Network Error: ' + err.message); 
                    }
                  }}
                  style={{ flex: 1, padding: '14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.2)' }}
                >
                  Confirm Citation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

  )
}

export default VehicleSearch
