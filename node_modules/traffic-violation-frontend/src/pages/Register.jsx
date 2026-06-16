import { API_BASE_URL } from '../config';
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

function Register() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone_no: '', password: '',
    plate_no: '', vehicle_type: '', vehicle_model: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/citizen/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone_no: formData.phone_no.trim(),
          password: formData.password,
          confirm_password: formData.password,
          plate_no: formData.plate_no.trim().toUpperCase(),
          vehicle_type: formData.vehicle_type,
          vehicle_model: formData.vehicle_model.trim()
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Registration failed')
      success('Account created successfully!')
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 14px',
    background: '#f8fafc',
    border: '1.5px solid #cbd5e1',
    borderRadius: '8px',
    color: '#111827', fontSize: '13px', outline: 'none',
    transition: 'all 0.18s', fontFamily: 'inherit',
  }
  const onFocus = (e) => {
    e.target.style.borderColor = '#1a3a6b'
    e.target.style.background = '#fff'
    e.target.style.boxShadow = '0 0 0 3px rgba(26,58,107,0.10)'
  }
  const onBlur = (e) => {
    e.target.style.borderColor = '#cbd5e1'
    e.target.style.background = '#f8fafc'
    e.target.style.boxShadow = 'none'
  }
  const lbl = {
    display: 'block', color: '#374151', fontSize: '13px',
    fontWeight: 700, marginBottom: '6px', letterSpacing: '0.3px',
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      position: 'relative',
      backgroundImage: 'url(/citizen_login_bg.png)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,25,55,0.55)', zIndex: 1 }} />

      {}
      <div style={{ position: 'absolute', top: '20px', right: '24px', zIndex: 10 }}>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(255,255,255,0.92)', color: '#1e3a6e',
          border: '1.5px solid rgba(255,255,255,0.6)', borderRadius: '6px',
          padding: '7px 16px', fontSize: '12px', fontWeight: 700,
          textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        }}>
          ← Back to Login
        </Link>
      </div>

      {}
      <div style={{
        position: 'relative', zIndex: 5,
        width: '100%', maxWidth: '480px',
        background: '#fff', borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.30)', overflow: 'hidden',
      }}>
        {}
        <div style={{
          background: 'linear-gradient(135deg, #1a3a6b 0%, #0f2550 100%)',
          padding: '28px 40px 24px', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <div style={{
              width: '72px', height: '72px',
              background: 'rgba(255,255,255,0.15)', borderRadius: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2.5px solid rgba(255,255,255,0.35)',
              boxShadow: '0 4px 18px rgba(0,0,0,0.22)',
            }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                <rect x="8" y="1" width="8" height="22" rx="4" fill="none" stroke="white" strokeWidth="1.8"/>
                <circle cx="12" cy="5" r="2.2" fill="#ef4444"/>
                <circle cx="12" cy="12" r="2.2" fill="#fbbf24"/>
                <circle cx="12" cy="19" r="2.2" fill="#22c55e"/>
              </svg>
            </div>
          </div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '20px' }}>Marga Rakshak</div>
          <div style={{ color: 'rgba(255,255,255,0.80)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '4px', fontWeight: 700 }}>
            Government of Tamil Nadu — Traffic Enforcement Portal
          </div>
          <div style={{
            display: 'inline-block', background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.25)', borderRadius: '4px',
            padding: '4px 14px', color: 'rgba(255,255,255,0.80)',
            fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '10px',
          }}>
            New Citizen Registration
          </div>
        </div>

        {}
        <div style={{ padding: '30px 36px 28px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ color: '#0f2550', fontSize: '22px', fontWeight: 800, margin: '0 0 5px' }}>
              Create Your Account
            </h1>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
              Fill in the details below to register as a citizen
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={lbl}>Full Name</label>
              <input type="text" name="full_name" value={formData.full_name} onChange={handleChange}
                placeholder="As per government records" required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>

            <div>
              <label style={lbl}>Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="your.email@example.com" required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>

            <div>
              <label style={lbl}>Mobile Number</label>
              <input type="text" name="phone_no" value={formData.phone_no} onChange={handleChange}
                placeholder="10-digit mobile number" required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>Vehicle Plate No.</label>
                <input type="text" name="plate_no" value={formData.plate_no} onChange={handleChange}
                  placeholder="TN01AB1234" required
                  style={{ ...inputStyle, textTransform: 'uppercase' }} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={lbl}>Vehicle Type</label>
                <select name="vehicle_type" value={formData.vehicle_type} onChange={handleChange} required
                  style={{ ...inputStyle, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">Select type</option>
                  {['Car', 'Motorcycle', 'Truck', 'Bus', 'Auto-Rickshaw', 'Other'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={lbl}>
                Vehicle Model <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
              </label>
              <input type="text" name="vehicle_model" value={formData.vehicle_model} onChange={handleChange}
                placeholder="e.g., Honda City, Royal Enfield" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>

            <div>
              <label style={lbl}>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange}
                placeholder="Create a strong password" required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '15px',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #1a3a6b 0%, #0f2550 100%)',
              color: '#fff', fontWeight: 800, fontSize: '15px',
              border: 'none', borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(15,37,80,0.35)',
              transition: 'all 0.18s', marginTop: '4px',
            }}>
              {loading ? 'Creating Account…' : 'Register as Citizen'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '22px 0 18px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
              Already registered?{' '}
              <Link to="/" style={{ color: '#1a3a6b', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
            </p>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
              Police officer?{' '}
              <Link to="/police/register" style={{ color: '#1a3a6b', fontWeight: 700, textDecoration: 'none' }}>Officer Registration</Link>
            </p>
          </div>
        </div>

        {}
        <div style={{
          background: '#f1f5f9', borderTop: '1px solid #e2e8f0',
          padding: '12px 36px', textAlign: 'center',
        }}>
          <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
            © 2026 Marga Rakshak · Traffic Violation Management System · Government of Tamil Nadu
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register