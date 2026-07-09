import { API_BASE_URL } from '../config';
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

function Login({ onLogin }) {
  const { success, error: showError } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, role: 'citizen' })
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
    background: '#f8fafc',
    border: '1.5px solid #cbd5e1',
    borderRadius: '8px',
    color: '#111827', fontSize: '14px', outline: 'none',
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

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex' }}>

      {}
      <div style={{
        flex: '1 1 55%',
        position: 'relative',
        backgroundImage: 'url(/citizen_login_bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '48px',
        minHeight: '100vh',
      }}>
        {}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,25,55,0.25) 0%, rgba(10,25,55,0.75) 100%)' }} />

        {}
        <div style={{ position: 'absolute', top: '32px', left: '48px', zIndex: 2, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', background: 'rgba(255,255,255,0.18)',
            borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="8" y="1" width="8" height="22" rx="4" fill="none" stroke="white" strokeWidth="1.8"/>
              <circle cx="12" cy="5" r="2.2" fill="#ef4444"/>
              <circle cx="12" cy="12" r="2.2" fill="#fbbf24"/>
              <circle cx="12" cy="19" r="2.2" fill="#22c55e"/>
            </svg>
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '16px', margin: 0, lineHeight: 1.2 }}>Marga Rakshak</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>Govt. of Tamil Nadu</p>
          </div>
        </div>

        {}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.30)',
            borderRadius: '999px', padding: '5px 14px', marginBottom: '20px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.8px' }}>Citizen Portal</span>
          </div>

          <h2 style={{ color: '#fff', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
            Join Marga Rakshak
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '15px', margin: '0 0 28px', lineHeight: 1.6, maxWidth: '400px' }}>
            Become a guardian of Tamil Nadu's roads. Report violations, earn trust score, and help build safer communities.
          </p>

          {/* Trust stats strip */}
          <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
            {[
              { value: '10+', label: 'Trust Points per Report' },
              { value: '24h', label: 'Police Review Time' },
              { value: '100%', label: 'Identity Protected' },
            ].map((s, i) => (
              <div key={i}>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: '20px', margin: 0 }}>{s.value}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: 0, letterSpacing: '0.3px' }}>{s.label}</p>
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
        padding: '48px 48px',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.10)',
        position: 'relative',
        zIndex: 2,
        overflowY: 'auto',
      }}>

        {/* Switch portal link */}
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <Link to="/police/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#f1f5f9', border: '1px solid #e2e8f0',
            borderRadius: '8px', padding: '7px 14px',
            color: '#334155', fontSize: '12px', fontWeight: 600,
            textDecoration: 'none',
          }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Police Portal →
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          {/* Gov Portal Identity — migrated from Hero */}
          <div className="gov-portal-text fade-up-enter" style={{ marginBottom: '12px' }}>
            <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Government of Tamil Nadu — Traffic Enforcement Portal
          </div>
          <div style={{
            display: 'inline-block', padding: '4px 12px',
            background: '#eff6ff', borderRadius: '6px',
            color: '#1d4ed8', fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '14px',
          }}>Citizen Sign In</div>
          <h1 style={{ color: '#0f172a', fontSize: '26px', fontWeight: 800, margin: '0 0 6px', lineHeight: 1.2 }}>
            Welcome Back
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Enter your registered credentials to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', color: '#374151', fontSize: '13px', fontWeight: 700, marginBottom: '7px' }}>
              Email Address
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              required style={inputStyle}
              onFocus={onFocus} onBlur={onBlur}
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
                placeholder="Enter your password"
                required style={{ ...inputStyle, paddingRight: '44px' }}
                onFocus={onFocus} onBlur={onBlur}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
                {showPassword
                  ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                  : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '15px',
            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #1a3a6b 0%, #0f2550 100%)',
            color: '#fff', fontWeight: 800, fontSize: '15px',
            border: 'none', borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(15,37,80,0.35)',
            transition: 'all 0.18s', marginTop: '4px', letterSpacing: '0.3px',
          }}>
            {loading ? 'Signing In…' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0 20px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#1a3a6b', fontWeight: 700, textDecoration: 'none' }}>
              Create Citizen Account
            </Link>
          </p>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
            Are you a police officer?{' '}
            <Link to="/police/login" style={{ color: '#1a3a6b', fontWeight: 700, textDecoration: 'none' }}>
              Officer Login
            </Link>
          </p>
        </div>

        <p style={{ color: '#cbd5e1', fontSize: '11px', textAlign: 'center', marginTop: '32px' }}>
          © 2026 Marga Rakshak · Government of Tamil Nadu
        </p>
      </div>
    </div>
  )
}

export default Login