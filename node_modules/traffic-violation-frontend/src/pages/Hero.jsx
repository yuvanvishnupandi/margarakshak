import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { API_BASE_URL } from '../config';
const API = API_BASE_URL;
// Replaced by automated script

const ZZ = 'polygon(0 100%,2% 0,4% 100%,6% 0,8% 100%,10% 0,12% 100%,14% 0,16% 100%,18% 0,20% 100%,22% 0,24% 100%,26% 0,28% 100%,30% 0,32% 100%,34% 0,36% 100%,38% 0,40% 100%,42% 0,44% 100%,46% 0,48% 100%,50% 0,52% 100%,54% 0,56% 100%,58% 0,60% 100%,62% 0,64% 100%,66% 0,68% 100%,70% 0,72% 100%,74% 0,76% 100%,78% 0,80% 100%,82% 0,84% 100%,86% 0,88% 100%,90% 0,92% 100%,94% 0,96% 100%,98% 0,100% 100%)'
const ZZ2 = 'polygon(0 0,2% 100%,4% 0,6% 100%,8% 0,10% 100%,12% 0,14% 100%,16% 0,18% 100%,20% 0,22% 100%,24% 0,26% 100%,28% 0,30% 100%,32% 0,34% 100%,36% 0,38% 100%,40% 0,42% 100%,44% 0,46% 100%,48% 0,50% 100%,52% 0,54% 100%,56% 0,58% 100%,60% 0,62% 100%,64% 0,66% 100%,68% 0,70% 100%,72% 0,74% 100%,76% 0,78% 100%,80% 0,82% 100%,84% 0,86% 100%,88% 0,90% 100%,92% 0,94% 100%,96% 0,98% 100%,100% 0)'
const LIGHT_BG = '#f0f4ff'

function Hero() {
  const navigate = useNavigate()
  const [displayText, setDisplayText] = useState('')
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const fullText = 'Safer Roads. Smarter Enforcement.'
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isPolice = user?.role === 'police'

  // Typing animation
  useEffect(() => {
    let i = 0
    const t = setInterval(() => {
      if (i <= fullText.length) { setDisplayText(fullText.slice(0, i)); i++ }
      else { clearInterval(t); setTimeout(() => setShowSubtitle(true), 300) }
    }, 70)
    return () => clearInterval(t)
  }, [])

  // Scroll reveal — runs on mount AND after showSubtitle renders conditional content
  const attachScrollReveal = () => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('sr-visible'); obs.unobserve(e.target) }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.sr:not(.sr-visible)').forEach(el => obs.observe(el))
    return obs
  }

  useEffect(() => {
    const obs = attachScrollReveal()
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!showSubtitle) return
    const timer = setTimeout(() => {
      const obs = attachScrollReveal()
      return () => obs.disconnect()
    }, 120)
    return () => clearTimeout(timer)
  }, [showSubtitle])

  useEffect(() => { if (showSubtitle) fetchLeaderboard() }, [showSubtitle])

  const fetchLeaderboard = async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/analytics/leaderboard`)
      if (r.ok) { const d = await r.json(); setLeaderboard(d.data || []) }
    } catch (e) { console.error('Leaderboard:', e) }
  }

  const btnBase = {
    padding: '15px 38px', borderRadius: '999px',
    fontSize: '16px', fontWeight: 700, border: 'none',
    cursor: 'pointer', transition: 'all 0.2s',
  }

  return (
    <div style={{ width:'100%', background:'var(--bg-primary)', overflowX:'hidden' }}>
      {/* ── 1. HERO VIEWPORT (includes feature cards) ── */}
      <section style={{
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '100px 48px 64px',
      }}>
        {/* Animated ambient blobs */}
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />
        <div className="hero-dots" />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '100%', maxWidth: '1100px' }}>


          {/* Heading */}
          <h1 style={{
            fontSize: 'clamp(28px, 5.5vw, 76px)',
            fontWeight: 900, color: 'var(--text-primary)',
            lineHeight: 1.06, letterSpacing: '-2px',
            margin: '0 0 24px',
          }}>
            {displayText}
            <span style={{ color: 'var(--accent)', animation: 'pulse 1.2s step-end infinite' }}>|</span>
          </h1>

          {showSubtitle && (
            <div className="animate-fade-in">
              <p style={{
                fontSize: 'clamp(15px, 1.6vw, 18px)',
                color: 'var(--text-secondary)', lineHeight: 1.7,
                maxWidth: '750px', margin: '0 auto 36px',
              }}>
                A modern traffic enforcement system empowering citizens and police to make roads safer together.
              </p>

              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '52px' }}>
                <button
                  onClick={() => navigate(isPolice ? '/police' : '/dashboard')}
                  style={{ ...btnBase, background: 'var(--text-primary)', color: 'var(--bg-primary)', boxShadow: 'var(--shadow)' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = 0.9; e.currentTarget.style.transform = 'scale(1.04)' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  {isPolice ? 'Police Dashboard →' : 'Go to Dashboard →'}
                </button>
                <button
                  onClick={() => navigate(isPolice ? '/police/review-reports' : '/submit-report')}
                  style={{ ...btnBase, background: 'transparent', color: 'var(--text-primary)', border: '2px solid var(--text-primary)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.transform = 'scale(1.04)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
                >
                  {isPolice ? 'Review Reports' : 'Submit Report'}
                </button>
              </div>

              {/* ── Feature Cards — same first page ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '22px', textAlign: 'left' }}>
                {[
                  {
                    icon: (
                      <svg width="22" height="22" fill="none" stroke="var(--bg-primary)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3" strokeWidth="1.8"/></svg>
                    ),
                    title: 'Report Violations',
                    desc: 'Capture and submit traffic violations with photo evidence directly from your device.',
                  },
                  {
                    icon: (
                      <svg width="22" height="22" fill="none" stroke="var(--bg-primary)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    ),
                    title: 'Police Verification',
                    desc: 'Dedicated officers review, verify, and issue challans for validated violations.',
                  },
                  {
                    icon: (
                      <svg width="22" height="22" fill="none" stroke="var(--bg-primary)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                    ),
                    title: 'Track Progress',
                    desc: 'Monitor your reports, analytics, and earn trust score rewards.',
                  },
                ].map((f, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-card)',
                    backdropFilter: 'blur(14px)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '20px', padding: '28px 24px',
                    transition: 'all 0.3s', cursor: 'default',
                    boxShadow: 'var(--shadow-card)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-5px)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{
                      width: '48px', height: '48px', background: 'var(--text-primary)',
                      borderRadius: '14px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', marginBottom: '18px',
                    }}>
                      {f.icon}
                    </div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{f.title}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 3. WHAT IS MARGA RAKSHAK — light indigo bg + zigzag ── */}
      {(
        <>
          {/* Zigzag top — background cuts into the light section */}
          <div style={{ height: '50px', background: 'var(--bg-primary)', clipPath: ZZ, marginBottom: '-1px', opacity: 0.8 }} />

          <section style={{ background: 'var(--bg-secondary)', padding: '64px 64px 80px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
              <div className="sr" style={{ textAlign: 'center', marginBottom: '56px' }}>
                <span style={{
                  display: 'inline-block', padding: '5px 16px',
                  background: 'var(--accent-light)', border: '1px solid var(--border)',
                  borderRadius: '999px', color: 'var(--accent-text)', fontSize: '11px',
                  fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '18px',
                }}>About the Platform</span>
                <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '14px' }}>
                  What is Marga Rakshak?
                </h2>
                <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto' }}>
                  Bridging citizens and law enforcement through participatory traffic management
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '22px' }}>
                {[
                  { title: 'Our Mission', accent: '#4f46e5', text: 'To create safer roads through community-powered enforcement. Every citizen becomes a guardian, every report makes a difference.' },
                  { title: 'How It Works', accent: '#0ea5e9', text: 'Citizens submit violations → Police verify and issue challans → Offenders pay fines → Trust Scores reward responsible citizens.' },
                  { title: 'Key Innovation', accent: '#10b981', text: 'Trust Score mechanism rewards accurate reporting (+10 pts) and penalizes false reports (−10 pts), ensuring quality submissions.' },
                  { title: 'The Future', accent: '#f59e0b', text: 'AI-powered YOLO detection, automated speed checking, biometric verification, and predictive analytics for full automation.' },
                ].concat([
                  { title: 'Impact Goals', accent: '#ef4444', text: 'Targeting 30% reduction in repeat violations within 1 year. Every verified report contributes to safer roads for all Tamil Nadu citizens.' },
                  { title: 'Privacy & Security', accent: '#6366f1', text: 'All citizen data is encrypted and handled under Government of Tamil Nadu data protection guidelines. Reports are anonymized for public dashboards.' },
                ]).map((c, i) => (
                  <div key={i} className="sr" style={{
                    background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                    borderRadius: '20px', padding: '36px 30px',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'all 0.3s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}
                  >
                    <div style={{ width: '4px', height: '32px', background: c.accent, borderRadius: '99px', marginBottom: '18px' }} />
                    <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>{c.title}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.75 }}>{c.text}</p>
                  </div>
                ))}
              </div>

              {/* ── Creator Credit ── */}
              <div className="sr" style={{ marginTop: '48px', display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '20px',
                  padding: '20px 32px', borderRadius: '20px',
                  background: 'var(--bg-card)', backdropFilter: 'blur(14px)',
                  border: '1.5px solid var(--border)',
                  boxShadow: 'var(--shadow-card)',
                }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '18px', flexShrink: 0 }}>Y</div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '1.2px', textTransform: 'uppercase' }}>Built by</p>
                    <p style={{ margin: '2px 0 0', fontSize: '17px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Yuvan Vishnu Pandi</p>
                  </div>
                  <div style={{ width: '1px', height: '40px', background: 'var(--border)', flexShrink: 0 }} />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {[
                      { href: 'https://github.com/yuvanvishnupandi', title: 'GitHub', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text-primary)"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg> },
                      { href: 'https://www.linkedin.com/in/yuvanvishnupandi', title: 'LinkedIn', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a66c2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                      { href: 'https://www.instagram.com/yuvvvnnnnnn/', title: 'Instagram', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="url(#ig)"><defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg> },
                    ].map(s => (
                      <a key={s.title} href={s.href} target="_blank" rel="noreferrer" title={s.title} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', textDecoration: 'none' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                      >{s.icon}</a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Zigzag bottom — background cuts back to white */}
          <div style={{ height: '50px', background: 'var(--bg-secondary)', clipPath: ZZ2, marginTop: '-1px' }} />
        </>
      )}



      {/* ── FOOTER ── */}
      <footer style={{ background: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ padding: '64px 64px 32px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '40px', marginBottom: '48px' }}>
            <div style={{ maxWidth: '340px' }}>
              <h3 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', marginBottom: '12px' }}>Experience Smart Enforcement</h3>
              <p style={{ color: '#6b7280', lineHeight: 1.7 }}>Join thousands of citizens making roads safer through participatory traffic management.</p>
            </div>
            <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
              {[
                { heading: 'Resources', links: [{ l: 'Penalty Points', h: '/rules' }, { l: 'Violation Types', h: '/rules' }, { l: 'FAQ', h: '#' }] },
                { heading: 'Legal', links: [{ l: 'Legal Terms', h: '#' }, { l: 'Privacy Policy', h: '#' }, { l: 'Contact Us', h: '#' }] },
                { heading: 'Platform', links: [{ l: 'Dashboard', h: '/dashboard' }, { l: 'Analytics', h: '/analytics' }, { l: 'Future Scopes', h: '/future-scopes' }] },
              ].map((col, i) => (
                <div key={i}>
                  <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#111827', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '16px' }}>{col.heading}</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {col.links.map((lk, j) => (
                      <li key={j}><a href={lk.h} style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#111827'}
                        onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
                      >{lk.l}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div style={{ overflow: 'hidden', margin: '0 -64px', padding: '0 64px' }}>
            <h1 style={{ fontSize: '11vw', fontWeight: 900, color: '#111827', lineHeight: 1, textAlign: 'center', opacity: 1, letterSpacing: '-4px', userSelect: 'none' }}>
              Marga Rakshak
            </h1>
          </div>
          {/* ── Made with Love ── */}
          <div style={{
            margin: '48px -64px 0', padding: '40px 64px',
            background: 'linear-gradient(135deg, #fff0f5 0%, #fce7f3 50%, #fff1f2 100%)',
            borderTop: '1px solid #fce7f3',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px', lineHeight: 1 }}>❤️</span>
              <p style={{ margin: 0, fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 900, color: '#111827', letterSpacing: '-0.5px' }}>
                Made with Love in India
              </p>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Built by{' '}
              <a href="https://www.linkedin.com/in/yuvanvishnupandi" target="_blank" rel="noreferrer"
                style={{ color: '#ec4899', fontWeight: 700, textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >Yuvan Vishnu Pandi</a>
              · 2026 · Tamil Nadu 🇮🇳
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border,#e5e7eb)', paddingTop: '24px', marginTop: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ color: 'var(--text-muted,#9ca3af)', fontSize: '13px', margin: 0 }}>© 2026 Marga Rakshak — Government of Tamil Nadu</p>
            <div style={{ display: 'flex', gap: '24px' }}>
              {['Privacy', 'Terms'].map(t => <a key={t} href="#" style={{ color: 'var(--text-muted,#9ca3af)', fontSize: '13px', textDecoration: 'none' }}>{t}</a>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Hero
