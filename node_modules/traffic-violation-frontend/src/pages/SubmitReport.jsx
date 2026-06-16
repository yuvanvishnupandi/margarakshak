import { API_BASE_URL } from '../config';
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

function SubmitReport() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [isSuspended, setIsSuspended] = useState(false)
  const [vehicleInfo, setVehicleInfo] = useState(null)
  const [vehicleLoading, setVehicleLoading] = useState(false)
  const [locLoading, setLocLoading] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [formData, setFormData] = useState({
    plate_no: '',
    violation_type: '',
    location_address: '',
    location_coords: '',
    incident_date: '',
    incident_time: '',
    description: ''
  })
  const [imagePreviews, setImagePreviews] = useState([])
  const [evidenceImages, setEvidenceImages] = useState([])
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')
        if (!userStr || !token) {
          showError('Please login to submit a report')
          navigate('/login')
          return
        }
        const user = JSON.parse(userStr)
        const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) {
          if (user.account_status === 'Suspended' || user.trust_score <= 0) setIsSuspended(true)
          return
        }
        const profile = await res.json()
        localStorage.setItem('user', JSON.stringify({ ...user, ...profile }))
        if (profile.account_status === 'Suspended' || profile.trust_score <= 0) setIsSuspended(true)
      } catch (err) {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          if (user.account_status === 'Suspended' || user.trust_score <= 0) setIsSuspended(true)
        }
      }
    }
    fetchUserProfile()
  }, [])

  const violationTypes = [
    'Speeding',
    'Red Light Violation',
    'No Helmet',
    'Wrong-Side Driving',
    'Using Phone',
    'Drunk Driving',
    'Overloading',
    'Other'
  ]

  const validateForm = () => {
    const newErrors = {}
    if (!formData.plate_no.trim()) newErrors.plate_no = 'Vehicle number plate is required'
    if (!formData.violation_type) newErrors.violation_type = 'Please select a violation type'
    if (!formData.location_address.trim()) newErrors.location_address = 'Location address is required'
    if (evidenceImages.length === 0) newErrors.evidence = 'At least 1 evidence photo is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) setErrors({ ...errors, [name]: '' })
    if (name === 'location_address') {
      
      if (value.length > 3) {
        clearTimeout(window._locTimer)
        window._locTimer = setTimeout(async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/weather/geocode?q=${encodeURIComponent(value)}`)
            const data = await res.json()
            if (data.success) { setLocationSuggestions(data.results); setShowSuggestions(true) }
          } catch (_) {}
        }, 600)
      } else {
        setLocationSuggestions([]); setShowSuggestions(false)
      }
    }
    if (name === 'plate_no') setVehicleInfo(null)
  }

  const fetchVehicleInfo = async () => {
    const plate = formData.plate_no.replace(/\s+/g, '').toUpperCase()
    if (plate.length < 5) { showError('Enter a valid plate number first'); return }
    setVehicleLoading(true); setVehicleInfo(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/weather/vehicle?plate=${plate}`)
      const data = await res.json()
      if (!res.ok) { showError(data.error || 'Lookup failed'); return }
      setVehicleInfo(data)
    } catch { showError('Could not reach vehicle lookup service') }
    finally { setVehicleLoading(false) }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showError("Geolocation is not supported by your browser")
      return
    }
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        const data = await res.json()
        if (data && data.display_name) {
          const shortAddr = [
            data.address?.road || data.address?.suburb || data.address?.neighbourhood,
            data.address?.city || data.address?.town || data.address?.village,
            data.address?.county || data.address?.district
          ].filter(Boolean).join(', ') || data.display_name.split(',').slice(0,3).join(',')
          
          setFormData(f => ({
            ...f,
            location_address: shortAddr,
            location_coords: `${lat},${lon}`
          }))
          success("Location acquired successfully")
        } else {
          showError("Could not determine address from coordinates")
        }
      } catch (err) {
        showError("Failed to fetch address")
      } finally {
        setLocLoading(false)
      }
    }, (err) => {
      showError("Failed to get location. Please check browser permissions.")
      setLocLoading(false)
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    const remaining = 3 - evidenceImages.length
    if (remaining <= 0) { showError('Maximum 3 photos allowed'); return }
    const toAdd = files.slice(0, remaining)
    const validated = []
    for (const file of toAdd) {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        showError('Only JPEG and PNG allowed'); continue
      }
      if (file.size > 5 * 1024 * 1024) {
        showError(`${file.name} exceeds 5 MB`); continue
      }
      validated.push(file)
    }
    if (validated.length === 0) return
    setEvidenceImages(prev => [...prev, ...validated])
    const newPreviews = []
    let loaded = 0
    validated.forEach((file, i) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews[i] = reader.result
        loaded++
        if (loaded === validated.length) setImagePreviews(prev => [...prev, ...newPreviews])
      }
      reader.readAsDataURL(file)
    })
    if (errors.evidence) setErrors({ ...errors, evidence: '' })
  }

  const removeImage = (idx) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== idx))
    setEvidenceImages(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) { showError('Please login to submit a report'); setLoading(false); return }
      const user = JSON.parse(userStr)
      const payload = {
        citizen_id: user.id,
        plate_no: formData.plate_no.toUpperCase().trim(),
        violation_type: formData.violation_type,
        location_address: formData.location_address.trim(),
        location_coords: formData.location_coords,
        description: formData.incident_date ? `[Incident Time: ${formData.incident_date} ${formData.incident_time}]\n${formData.description.trim() || 'No additional description'}` : formData.description.trim() || 'No additional description'
      }
      const res = await fetch(`${API_BASE_URL}/api/reports/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || result.detail || 'Failed to submit report')
      const reportId = result.report_id

      for (const img of evidenceImages) {
        try {
          const fd = new FormData()
          fd.append('file', img)
          await fetch(`${API_BASE_URL}/api/reports/upload-evidence/${reportId}`, {
            method: 'POST', body: fd
          })
        } catch (err) {
          console.warn('Evidence upload warning (non-fatal):', err)
        }
      }

      success('Report submitted successfully!')
      setFormData({ plate_no: '', violation_type: '', location_address: '', location_coords: '', description: '' })
      setImagePreviews([])
      setEvidenceImages([])
      setTimeout(() => navigate('/my-reports'), 2000)
    } catch (err) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fieldStyle = (hasErr) => ({
    width: '100%',
    padding: '11px 14px',
    border: `1.5px solid ${hasErr ? 'var(--danger)' : 'var(--border)'}`,
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    background: 'var(--bg-primary)',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  })

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
  }

  const errorStyle = { color: 'var(--danger)', fontSize: '12px', marginTop: '4px', display: 'block' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '100px 24px 60px', fontFamily: 'inherit' }}>

      {}
      {isSuspended && (
        <div style={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ maxWidth: '860px', width: '100%' }}>

            {}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#fef2f2,#fee2e2)', border: '2px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(220,38,38,0.15)' }}>
                <svg width="36" height="36" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#991b1b', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Account Suspended</h1>
              <p style={{ color: '#b91c1c', fontSize: '15px', margin: 0, lineHeight: 1.6 }}>
                Your Civic Trust Score has dropped to <strong>0</strong>. Submitting reports is temporarily disabled.<br/>
                Present valid government-issued ID to appeal and restore your account.
              </p>
            </div>

            {}
            <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '16px', padding: '24px 28px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 16px', fontWeight: 800, fontSize: '13px', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.8px' }}>📋 Appeal Process</p>
              {[
                { step: '1', text: 'Collect your Aadhaar card / Voter ID / Driving Licence (any one)' },
                { step: '2', text: 'Visit the nearest Tamil Nadu Traffic Police office in person' },
                { step: '3', text: 'Request an Account Appeal Form and mention your registered email' },
                { step: '4', text: 'Appeal decision is issued within 5–7 working days' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: '14px', marginBottom: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#f97316', color: '#fff', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.step}</div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: 1.6 }}>{s.text}</p>
                </div>
              ))}
            </div>

            {}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              {[
                { icon: '📞', label: 'Traffic Helpline', value: '1800 425 1520', sub: 'Toll-free · 24 / 7' },
                { icon: '📞', label: 'Police Control Room', value: '100', sub: 'Emergency' },
                { icon: '📧', label: 'Email Appeals', value: 'tnpolice@gov.in', sub: 'Reply within 3 working days' },
                { icon: '🌐', label: 'Online Portal', value: 'eservices.tnpolice.gov.in', sub: 'File appeal online' },
              ].map((c, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '16px 18px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{c.icon} {c.label}</p>
                  <p style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{c.value}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>{c.sub}</p>
                </div>
              ))}
            </div>

            {}
            <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '14px', padding: '20px 24px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 14px', fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>🏛️ Key Traffic Police Offices</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { city: 'Chennai', addr: '4, Commissioner\'s Office, Vepery, Chennai – 600 007', ph: '044-28447777' },
                  { city: 'Coimbatore', addr: 'Traffic Police Office, Sathyamangalam Road, CBE', ph: '0422-2220100' },
                  { city: 'Madurai', addr: 'Traffic Police HQ, Race Course, Madurai – 625 002', ph: '0452-2537373' },
                  { city: 'Trichy', addr: 'SP Office, Williams Road, Cantonment, Trichy', ph: '0431-2415100' },
                ].map((o, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>{o.city}</p>
                    <p style={{ margin: '0 0 3px', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{o.addr}</p>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#1d4ed8' }}>{o.ph}</p>
                  </div>
                ))}
              </div>
            </div>

            {}
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="https://eservices.tnpolice.gov.in" target="_blank" rel="noreferrer" style={{ flex: 1, padding: '13px', borderRadius: '10px', background: '#1e1b4b', color: '#fff', fontWeight: 700, fontSize: '14px', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                File Online Appeal →
              </a>
              <button onClick={() => window.location.href = 'tel:1800425520'} style={{ flex: 1, padding: '13px', borderRadius: '10px', background: 'transparent', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                📞 Call Helpline
              </button>
            </div>

          </div>
        </div>
      )}

      {!isSuspended && (
        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>

          {}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Submit Violation Report</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Report traffic violations with photo evidence. All submissions are reviewed by Tamil Nadu Traffic Police within 24 hours.
            </p>
          </div>

          {}
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr' }}>

              {}
              <div style={{ background: 'linear-gradient(170deg, #0f172a 0%, #1e1b4b 100%)', padding: '36px 24px', display: 'flex', flexDirection: 'column', gap: '0' }}>

                {}
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    {}
                    <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.85)" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ color: '#fff', fontWeight: 700, fontSize: '13px', margin: 0 }}>Traffic Violation Reporting</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tamil Nadu Police</p>
                    </div>
                  </div>
                </div>

                {}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: 'auto' }}>
                  {[
                    {
                      title: 'Verified by Police',
                      desc: 'Every report reviewed by authorised officers',
                      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    },
                    {
                      title: 'Earn Trust Points',
                      desc: '+10 trust score per verified submission',
                      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    },
                    {
                      title: 'Location Tracked',
                      desc: 'Geo-tagged for heatmap analysis',
                      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    },
                    {
                      title: 'Identity Protected',
                      desc: 'Your identity stays anonymised during review',
                      svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    },
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                        <svg width="15" height="15" fill="none" stroke="rgba(255,255,255,0.65)" viewBox="0 0 24 24">{f.svg}</svg>
                      </div>
                      <div>
                        <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '12px', margin: '0 0 2px' }}>{f.title}</p>
                        <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '11px', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {}
                <div style={{ marginTop: '32px', padding: '14px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', margin: '0 0 3px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Helpline</p>
                  <p style={{ color: '#fff', fontSize: '17px', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>1800 425 1520</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: '3px 0 0' }}>24 / 7 — Tamil Nadu Traffic Police</p>
                </div>
              </div>

              {}
              <div style={{ padding: '36px 40px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

                  {}
                  <div>
                    <label style={labelStyle}>
                      Vehicle Number Plate <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          name="plate_no"
                          value={formData.plate_no}
                          onChange={handleChange}
                          placeholder="TN 01 AB 1234"
                          style={{
                            ...fieldStyle(errors.plate_no),
                            textTransform: 'uppercase',
                            fontFamily: "'Courier New', monospace",
                            fontWeight: 700,
                            letterSpacing: '2.5px',
                            fontSize: '15px',
                          }}
                          onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.10)' }}
                          onBlur={e => { e.target.style.borderColor = errors.plate_no ? '#dc2626' : '#d1d5db'; e.target.style.boxShadow = 'none' }}
                        />
                      </div>
                      <button type="button" onClick={fetchVehicleInfo} disabled={vehicleLoading} style={{
                        padding: '11px 14px', borderRadius: '8px', border: 'none',
                        background: vehicleLoading ? '#6b7280' : '#7c3aed',
                        color: '#fff', fontSize: '12px', fontWeight: 700,
                        cursor: vehicleLoading ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0
                      }}>
                        {vehicleLoading
                          ? <svg style={{ animation: 'spin 0.8s linear infinite' }} width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/></svg>
                          : <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>}
                        {vehicleLoading ? 'Fetching…' : 'Parivahan'}
                      </button>
                    </div>
                    {errors.plate_no && <span style={errorStyle}>{errors.plate_no}</span>}

                    {}
                    {vehicleInfo && (
                      <div style={{ marginTop: '10px', borderRadius: '12px', border: '1.5px solid var(--primary)', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                        <div style={{ padding: '10px 14px', background: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="14" height="14" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                          <p style={{ margin: 0, color: '#fff', fontSize: '11px', fontWeight: 700 }}>Parivahan — MoRTH, Govt. of India</p>
                          <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(255,255,255,0.75)' }}>{vehicleInfo.plate}</span>
                        </div>
                        <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {[
                            { label: 'Vehicle', value: `${vehicleInfo.vehicle.make} ${vehicleInfo.vehicle.model}` },
                            { label: 'Type', value: vehicleInfo.vehicle.type },
                            { label: 'Color', value: vehicleInfo.vehicle.color },
                            { label: 'Fuel', value: vehicleInfo.vehicle.fuel_type },
                            { label: 'Year', value: vehicleInfo.vehicle.year_of_manufacture },
                            { label: 'RTO', value: vehicleInfo.registration.rto },
                            { label: 'Insurance', value: vehicleInfo.insurance.status, color: vehicleInfo.insurance.status === 'Valid' ? 'var(--success)' : 'var(--danger)' },
                            { label: 'PUC', value: vehicleInfo.pollution.status, color: vehicleInfo.pollution.status.includes('Valid') ? 'var(--success)' : 'var(--danger)' },
                          ].map((f, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{f.label}</span>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: f.color || 'var(--text-primary)' }}>{f.value}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding: '6px 14px', background: 'var(--bg-input)', borderTop: '1px solid var(--border)' }}>
                          <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-secondary)' }}>Insurance by: {vehicleInfo.insurance.company} · Valid till {vehicleInfo.insurance.valid_until}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {}
                  <div>
                    <label style={labelStyle}>
                      Violation Type <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        name="violation_type"
                        value={formData.violation_type}
                        onChange={(e) => {
                          setFormData({ ...formData, violation_type: e.target.value })
                          if (errors.violation_type) setErrors({ ...errors, violation_type: '' })
                        }}
                        style={{
                          ...fieldStyle(errors.violation_type),
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          cursor: 'pointer',
                          paddingRight: '40px',
                          color: formData.violation_type ? 'var(--text-primary)' : 'var(--text-muted)',
                        }}
                        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.10)' }}
                        onBlur={e => { e.target.style.borderColor = errors.violation_type ? 'var(--danger)' : 'var(--border)'; e.target.style.boxShadow = 'none' }}
                      >
                        <option value="" disabled>Select violation type</option>
                        {violationTypes.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      {}
                      <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <svg width="14" height="14" fill="none" stroke="#6b7280" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </div>
                    {errors.violation_type && <span style={errorStyle}>{errors.violation_type}</span>}
                  </div>

                  {}
                  <div>
                    <label style={labelStyle}>
                      Location of Incident <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    {}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input
                          type="text"
                          name="location_address"
                          value={formData.location_address}
                          onChange={handleChange}
                          onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          placeholder="e.g. Near T Nagar Bus Stand, Anna Salai, Chennai"
                          style={fieldStyle(errors.location_address)}
                        />
                        {}
                        {showSuggestions && locationSuggestions.length > 0 && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-card)', marginTop: '4px', overflow: 'hidden' }}>
                            <div style={{ padding: '6px 10px', background: 'var(--success-light)', borderBottom: '1px solid var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--success)"><circle cx="12" cy="12" r="10"/></svg>
                              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--success)' }}>OpenStreetMap — Live suggestions</span>
                            </div>
                            {locationSuggestions.slice(0,4).map((s, i) => (
                              <div key={i}
                                onMouseDown={() => { 
                                  setFormData(f => ({ 
                                    ...f, 
                                    location_address: s.short || s.display_name.split(',').slice(0,3).join(','),
                                    location_coords: `${s.lat},${s.lon}`
                                  })); 
                                  setShowSuggestions(false) 
                                }}
                                style={{ padding: '9px 12px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', lineHeight: 1.4 }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <div style={{ fontWeight: 600 }}>{s.short || s.display_name.split(',')[0]}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.display_name.split(',').slice(1,4).join(',').trim()}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={getCurrentLocation} disabled={locLoading} style={{
                        height: '44px', padding: '0 16px', borderRadius: '8px', border: '1.5px solid var(--border)',
                        background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700,
                        cursor: locLoading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => !locLoading && (e.currentTarget.style.background = 'var(--border)')}
                      onMouseLeave={e => !locLoading && (e.currentTarget.style.background = 'var(--bg-secondary)')}
                      >
                        {locLoading ? (
                          <svg style={{ animation: 'spin 0.8s linear infinite' }} width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--text-muted)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                        ) : (
                          <svg width="15" height="15" fill="none" stroke="#2563eb" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        )}
                        {locLoading ? 'Locating…' : 'Current Loc'}
                      </button>
                    </div>
                    {errors.location_address && <span style={errorStyle}>{errors.location_address}</span>}
                  </div>

                  {}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <label style={labelStyle}>Evidence Photos <span style={{ color: '#dc2626' }}>*</span></label>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>({evidenceImages.length}/3 added)</span>
                    </div>

                    {}
                    {imagePreviews.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${imagePreviews.length}, 1fr)`, gap: '8px', marginBottom: '10px' }}>
                        {imagePreviews.map((src, i) => (
                          <div key={i} className="photo-thumb-appear" style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '2px solid #4f46e5', aspectRatio: '4/3', background: '#f5f3ff' }}>
                            <img src={src} alt={`Evidence ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: '4px', left: '5px', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px' }}>Photo {i + 1}</div>
                            <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(220,38,38,0.85)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 800, padding: '2px 5px', lineHeight: 1 }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {}
                    {evidenceImages.length < 3 && (
                      <label style={{ display: 'block', cursor: 'pointer' }}>
                        <input type="file" accept="image/jpeg,image/png" multiple onChange={handleImageChange} style={{ display: 'none' }} />
                        <div style={{ border: `1.5px dashed ${errors.evidence ? 'var(--danger)' : 'var(--border)'}`, borderRadius: '10px', padding: '18px', textAlign: 'center', background: 'var(--bg-secondary)', transition: 'border-color 0.15s, background 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--bg-input)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = errors.evidence ? 'var(--danger)' : 'var(--border)'; e.currentTarget.style.background = 'var(--bg-secondary)' }}
                        >
                          <div style={{ width: '36px', height: '36px', background: 'var(--primary-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                            <svg width="18" height="18" fill="none" stroke="var(--primary)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          </div>
                          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px', margin: '0 0 2px' }}>
                            {evidenceImages.length === 0 ? 'Click to add evidence photos' : `Add more (${3 - evidenceImages.length} slot${3 - evidenceImages.length !== 1 ? 's' : ''} left)`}
                          </p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '10px', margin: 0 }}>JPEG or PNG · max 5 MB each · up to 3 photos</p>
                        </div>
                      </label>
                    )}
                    {errors.evidence && <span style={errorStyle}>{errors.evidence}</span>}
                  </div>

                  {}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>
                        Date of Incident <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="date"
                        name="incident_date"
                        value={formData.incident_date}
                        onChange={handleChange}
                        required
                        max={new Date().toISOString().split('T')[0]}
                        style={fieldStyle(false)}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>
                        Time of Incident <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="time"
                        name="incident_time"
                        value={formData.incident_time}
                        onChange={handleChange}
                        required
                        style={fieldStyle(false)}
                      />
                    </div>
                  </div>

                  {}
                  <div>
                    <label style={labelStyle}>
                      Additional Description <span style={{ color: '#9ca3af', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Optional)</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Provide any additional details about the violation..."
                      rows={3}
                      style={{ ...fieldStyle(false), resize: 'none', lineHeight: 1.6 }}
                      onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.10)' }}
                      onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
                    />
                  </div>

                  {}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%', padding: '13px', borderRadius: '10px',
                      background: loading ? '#6b7280' : '#1e1b4b',
                      color: '#fff', fontSize: '14px', fontWeight: 700,
                      border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: loading ? 'none' : '0 2px 12px rgba(30,27,75,0.30)',
                      transition: 'all 0.15s', letterSpacing: '0.3px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                    onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#312e81'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(30,27,75,0.38)' } }}
                    onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#1e1b4b'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(30,27,75,0.30)' } }}
                  >
                    {loading ? (
                      <>
                        <svg style={{ animation: 'spin 0.8s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Submitting Report...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Submit Violation Report
                      </>
                    )}
                  </button>

                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubmitReport
