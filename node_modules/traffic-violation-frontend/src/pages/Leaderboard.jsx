import { useState, useEffect } from 'react'

import { API_BASE_URL } from '../config';
const API = API_BASE_URL;

const CrownIcon = ({ size = 22, color = '#f59e0b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M3 16L5 8l4 4 3-6 3 6 4-4 2 8H3z"/>
    <rect x="3" y="17.5" width="18" height="2.5" rx="1.25" fill={color} opacity="0.65"/>
  </svg>
)

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) setUser(JSON.parse(userStr))
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/analytics/leaderboard`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setLeaderboard(data.data || [])
    } catch (err) {
      console.error('Leaderboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = leaderboard.filter(c =>
    !search || (c.full_name || '').toLowerCase().includes(search.toLowerCase())
  )
  const top3 = leaderboard.slice(0, 3)

  const podiumConfig = [
    { idx: 1, crownColor: '#9ca3af', label: '2nd', border: '#d1d5db', glow: 'rgba(156,163,175,0.18)', height: '185px', crownSize: 20 },
    { idx: 0, crownColor: '#f59e0b', label: '1st', border: '#f59e0b', glow: 'rgba(245,158,11,0.25)', height: '230px', crownSize: 30 },
    { idx: 2, crownColor: '#d97706', label: '3rd', border: '#fcd34d', glow: 'rgba(217,119,6,0.18)', height: '165px', crownSize: 18 },
  ]

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '88px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', margin: 0 }}>Loading Leaderboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: 'inherit' }}>

      {}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)', padding: '110px 40px 90px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(99,102,241,0.10)', top: '-120px', left: '-100px', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(6,182,212,0.09)', bottom: '-60px', right: '8%', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '860px', margin: '0 auto', position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <h1 className="fade-up-enter" style={{ fontSize: 'clamp(30px,5vw,54px)', fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-1.5px' }}>
            Citizen Leaderboard
          </h1>
          <p className="fade-up-enter fu-d1" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '16px', margin: '0 0 28px', lineHeight: 1.6 }}>
            Top citizens ranked by Trust Score — earned through verified traffic violation reports
          </p>
          <div className="fade-up-enter fu-d2" style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="14" height="14" fill="none" stroke="white" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px 11px 36px', background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.14)', borderRadius: '999px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; e.target.style.background = 'rgba(255,255,255,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.14)'; e.target.style.background = 'rgba(255,255,255,0.08)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {}
      {top3.length >= 3 && !search && (
        <div style={{ maxWidth: '860px', margin: '-44px auto 0', padding: '0 24px', position: 'relative', zIndex: 3 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', alignItems: 'flex-end' }}>
            {podiumConfig.map(({ idx, crownColor, label, border, glow, height, crownSize }) => {
              const citizen = top3[idx]
              if (!citizen) return null
              const isFirst = idx === 0
              return (
                <div key={citizen.citizen_id} className="fade-up-enter"
                  style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(24px)', borderRadius: '22px', border: `2px solid ${border}`, boxShadow: `0 10px 36px ${glow}, 0 2px 10px rgba(0,0,0,0.10)`, padding: '22px 18px', textAlign: 'center', minHeight: height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.25s, box-shadow 0.25s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = `0 20px 52px ${glow}, 0 4px 16px rgba(0,0,0,0.13)` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 10px 36px ${glow}, 0 2px 10px rgba(0,0,0,0.10)` }}
                >
                  <div className="crown-pop" style={{ marginBottom: '6px' }}><CrownIcon size={crownSize} color={crownColor} /></div>
                  <div style={{ width: isFirst ? '54px' : '42px', height: isFirst ? '54px' : '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: isFirst ? '20px' : '15px', marginBottom: '8px' }}>
                    {citizen.full_name?.[0] || 'U'}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: isFirst ? '14px' : '12px', color: '#111827', marginBottom: '4px' }}>{citizen.full_name}</div>
                  <div style={{ display: 'inline-block', padding: '2px 10px', background: idx === 0 ? '#fef3c7' : '#f3f4f6', color: crownColor, borderRadius: '999px', fontSize: '10px', fontWeight: 800, border: `1px solid ${border}`, marginBottom: '8px' }}>{label}</div>
                  <div style={{ fontSize: isFirst ? '30px' : '22px', fontWeight: 900, color: '#4f46e5', lineHeight: 1 }}>{citizen.trust_score}</div>
                  <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Trust Score</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px', fontWeight: 600, background: '#f0f4ff', borderRadius: '999px', padding: '2px 10px' }}>{citizen.reward_points || 0} reward pts</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {}
      <div style={{ maxWidth: '860px', margin: '28px auto 56px', padding: '0 24px' }}>
        <div style={{ background: '#fff', borderRadius: '20px', border: '1.5px solid #e0e7ff', boxShadow: '0 4px 24px rgba(99,102,241,0.07)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f2ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Complete Rankings</h2>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '3px 0 0' }}>Top {Math.min(filtered.length, 10)} of {leaderboard.length} citizens</p>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8faff' }}>
                {['Rank', 'Citizen', 'Trust Score', 'Reports', 'Rewards'].map(h => (
                  <th key={h} style={{ padding: '11px 20px', textAlign: h === 'Citizen' ? 'left' : 'center', fontSize: '10px', fontWeight: 700, color: '#6b7280', letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: '1px solid #f0f2ff' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 10).map((citizen, index) => {
                const isMe = user && citizen.citizen_id === user.id
                const isTop3 = index < 3
                const crownColors = ['#f59e0b', '#9ca3af', '#d97706']
                const cc = crownColors[index] || null
                return (
                  <tr key={citizen.citizen_id}
                    className={`fade-up-enter fu-d${Math.min(index + 1, 5)}`}
                    style={{ borderBottom: '1px solid #f3f4f6', background: isMe ? 'rgba(99,102,241,0.04)' : '#fff', transition: 'background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8faff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = isMe ? 'rgba(99,102,241,0.04)' : '#fff' }}
                  >
                    <td style={{ padding: '13px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        {isTop3 && cc && <CrownIcon size={13} color={cc} />}
                        <span style={{ fontWeight: 900, fontSize: '13px', color: isTop3 ? cc : '#6b7280' }}>#{index + 1}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>
                          {(citizen.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                            {citizen.full_name}
                            {isMe && <span style={{ marginLeft: '6px', fontSize: '9px', background: '#ede9fe', color: '#6d28d9', padding: '2px 7px', borderRadius: '999px', fontWeight: 800 }}>You</span>}
                          </p>
                          <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af' }}>{citizen.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 20px', textAlign: 'center' }}>
                      <span style={{ fontSize: '17px', fontWeight: 900, color: citizen.trust_score >= 90 ? '#10b981' : citizen.trust_score >= 70 ? '#6366f1' : citizen.trust_score >= 50 ? '#f59e0b' : '#ef4444' }}>{citizen.trust_score}</span>
                    </td>
                    <td style={{ padding: '13px 20px', textAlign: 'center', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>{citizen.reports_submitted || 0}</td>
                    <td style={{ padding: '13px 20px', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#6d28d9', background: '#f5f3ff', padding: '3px 10px', borderRadius: '999px', border: '1px solid #ede9fe' }}>{citizen.reward_points || 0}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ padding: '14px 24px', background: '#fafbff', borderTop: '1px solid #f0f2ff', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
              +10 trust points per verified report · −10 per rejected · Rankings update in real-time
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
