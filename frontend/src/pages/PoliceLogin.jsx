import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

function PoliceLogin({ onLogin }) {
  const { success, error: showError } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, role: 'police' })
      })
      const data = await res.json()
      if (!res.ok) {
        let message = 'Login failed'
        if (typeof data?.error === 'string') message = data.error
        else if (typeof data?.message === 'string') message = data.message
        else if (typeof data?.detail === 'string') message = data.detail
        else if (Array.isArray(data?.detail)) message = data.detail.map(e => e.msg || JSON.stringify(e)).join(', ')
        throw new Error(message)
      }
      success('Login successful!')
      const token = data.access_token || data.token
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(data.user))
      if (onLogin) onLogin(data)
    } catch (err) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '13px 16px',
    background: '#fafaf9',
    border: '1.5px solid #d6d3d1',
    borderRadius: '8px',
    color: '#111827', fontSize: '14px', outline: 'none',
    transition: 'all 0.18s', fontFamily: 'inherit',
  }
  const onFocus = (e) => {
    e.target.style.borderColor = '#78350f'
    e.target.style.background = '#fff'
    e.target.style.boxShadow = '0 0 0 3px rgba(120,53,15,0.10)'
  }
  const onBlur = (e) => {
    e.target.style.borderColor = '#d6d3d1'
    e.target.style.background = '#fafaf9'
    e.target.style.boxShadow = 'none'
  }

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex' }}>

      {/* ── LEFT PANEL — police branding ── */}
      <div style={{
        flex: '1 1 55%',
        position: 'relative',
        backgroundImage: 'url(/police_login_bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '48px',
        minHeight: '100vh',
      }}>
        {/* Deep gradient overlay — police feel */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,23,42,0.20) 0%, rgba(15,23,42,0.78) 100%)' }} />

        {/* Top left — logo strip */}
        <div style={{ position: 'absolute', top: '32px', left: '48px', zIndex: 2, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', background: 'rgba(255,255,255,0.14)',
            borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="white"/>
            </svg>
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '16px', margin: 0, lineHeight: 1.2 }}>Marga Rakshak</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>Tamil Nadu Police</p>
          </div>
        </div>

        {/* Restricted access badge — top right */}
        <div style={{ position: 'absolute', top: '36px', right: '48px', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.40)',
            borderRadius: '999px', padding: '5px 14px',
          }}>
            <svg width="10" height="10" fill="#fbbf24" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span style={{ color: '#fbbf24', fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Restricted Access</span>
          </div>
        </div>

        {/* Bottom left — police branding copy */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Warning stripe */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.30)',
            borderRadius: '6px', padding: '5px 12px', marginBottom: '20px',
          }}>
            <svg width="12" height="12" fill="none" stroke="#fbbf24" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <span style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 600 }}>Authorised Personnel Only</span>
          </div>

          <h2 style={{ color: '#fff', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
            Tamil Nadu<br />Traffic Police
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: '15px', margin: '0 0 28px', lineHeight: 1.6, maxWidth: '380px' }}>
            Secure officer portal for reviewing citizen reports, issuing challans, and maintaining law enforcement records.
          </p>

          {/* Info stats strip */}
          <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
            {[
              { value: '24h', label: 'Review SLA' },
              { value: 'SSL', label: 'Encrypted Access' },
              { value: 'IPS', label: 'Tamper-Proof Logs' },
            ].map((s, i) => (
              <div key={i}>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: '20px', margin: 0 }}>{s.value}</p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', margin: 0, letterSpacing: '0.3px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — login form ── */}
      <div style={{
        flex: '0 0 420px',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
        position: 'relative',
        zIndex: 2,
        overflowY: 'auto',
      }}>

        {/* Switch portal link */}
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#f1f5f9', border: '1px solid #e2e8f0',
            borderRadius: '8px', padding: '7px 14px',
            color: '#334155', fontSize: '12px', fontWeight: 600,
            textDecoration: 'none',
          }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            Citizen Portal →
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          {/* Gov Portal Identity — migrated from Hero */}
          <div className="gov-portal-text-amber fade-up-enter" style={{ marginBottom: '12px' }}>
            <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Government of Tamil Nadu — Traffic Enforcement Portal
          </div>
          <div style={{
            display: 'inline-block', padding: '4px 12px',
            background: '#fef3c7', borderRadius: '6px',
            color: '#92400e', fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '14px',
          }}>Officer Sign In</div>
          <h1 style={{ color: '#451a03', fontSize: '26px', fontWeight: 800, margin: '0 0 6px', lineHeight: 1.2 }}>
            Officer Access
          </h1>
          <p style={{ color: '#78716c', fontSize: '14px', margin: 0 }}>
            Enter your official police credentials to continue
          </p>
        </div>

        {/* Restricted notice stripe */}
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2">
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          <span style={{ color: '#92400e', fontSize: '12px', fontWeight: 600 }}>
            Restricted — Authorised Law Enforcement Only
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', color: '#374151', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>
              Official Email Address
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="officer@tnpolice.gov.in" required
              style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#374151', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" required
                style={{ ...inputStyle, paddingRight: '44px' }}
                onFocus={onFocus} onBlur={onBlur}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#a8a29e', cursor: 'pointer', padding: 0 }}>
                {showPassword
                  ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>
                  : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '15px',
            background: loading ? '#a8a29e' : 'linear-gradient(135deg, #78350f 0%, #451a03 100%)',
            color: '#fff', fontWeight: 800, fontSize: '15px',
            border: 'none', borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(69,26,3,0.38)',
            transition: 'all 0.18s', marginTop: '4px',
          }}>
            {loading ? 'Verifying…' : 'Officer Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0 20px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e7e5e4' }} />
          <span style={{ color: '#a8a29e', fontSize: '12px' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#e7e5e4' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center' }}>
          <p style={{ color: '#78716c', fontSize: '13px', margin: 0 }}>
            Need an officer account?{' '}
            <Link to="/police/register" style={{ color: '#78350f', fontWeight: 700, textDecoration: 'none' }}>
              Officer Registration
            </Link>
          </p>
          <p style={{ color: '#78716c', fontSize: '13px', margin: 0 }}>
            Not an officer?{' '}
            <Link to="/" style={{ color: '#78350f', fontWeight: 700, textDecoration: 'none' }}>
              Citizen Login
            </Link>
          </p>
        </div>

        <p style={{ color: '#cbd5e1', fontSize: '11px', textAlign: 'center', marginTop: '32px' }}>
          © 2026 Marga Rakshak · Tamil Nadu Police · Authorized Access Only
        </p>
      </div>
    </div>
  )
}

export default PoliceLogin
