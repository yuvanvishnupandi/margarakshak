import { useState } from 'react'
import { useTheme, THEMES } from '../context/ThemeContext'

const Section = ({ title, icon, children }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1.5px solid var(--border)',
    borderRadius: '20px', padding: '32px 36px', marginBottom: '24px',
    boxShadow: 'var(--shadow-card)',
  }}>
    <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px', paddingBottom:'18px', borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontSize:'22px', lineHeight:1 }}>{icon}</span>
      <h2 style={{ margin:0, fontSize:'14px', fontWeight:800, color:'var(--text-primary)', textTransform:'uppercase', letterSpacing:'0.8px' }}>{title}</h2>
    </div>
    {children}
  </div>
)

const Toggle = ({ label, desc, value, onChange }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
    <div style={{ flex:1, paddingRight:'24px' }}>
      <p style={{ margin:0, fontSize:'14px', fontWeight:600, color:'var(--text-primary)' }}>{label}</p>
      {desc && <p style={{ margin:'3px 0 0', fontSize:'12px', color:'var(--text-muted)', lineHeight:1.5 }}>{desc}</p>}
    </div>
    <button onClick={() => onChange(!value)} style={{
      width:'52px', height:'28px', borderRadius:'999px',
      background: value ? 'var(--accent)' : 'var(--border-strong)',
      border:'none', cursor:'pointer', position:'relative', flexShrink:0,
    }}>
      <span style={{
        position:'absolute', top:'4px', left: value ? '26px' : '4px',
        width:'20px', height:'20px', borderRadius:'50%',
        background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.25)',
        transition:'left 0.2s ease',
      }}/>
    </button>
  </div>
)

// Group themes by category
const groupedThemes = Object.values(THEMES).reduce((acc, t) => {
  if (!acc[t.group]) acc[t.group] = []
  acc[t.group].push(t)
  return acc
}, {})

export default function Settings() {
  const { themeId, setThemeId } = useTheme()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mr-prefs') || '{}') } catch { return {} }
  })

  const updatePref = (key, val) => {
    const next = { ...prefs, [key]: val }
    setPrefs(next)
    localStorage.setItem('mr-prefs', JSON.stringify(next))
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', paddingTop:'96px', color:'var(--text-primary)', fontFamily:'inherit' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'32px 48px 80px' }}>

        {/* ── Header ─────────────────────── */}
        <div style={{ marginBottom:'36px', paddingBottom:'22px', borderBottom:'1.5px solid var(--border)' }}>
          <span style={{ display:'inline-block', padding:'4px 14px', background:'var(--accent-light)', color:'var(--accent-text)', fontSize:'11px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', borderRadius:'999px', marginBottom:'12px' }}>
            User Preferences
          </span>
          <h1 style={{ fontSize:'clamp(24px,3vw,34px)', fontWeight:900, color:'var(--text-primary)', margin:'0 0 4px', letterSpacing:'-0.5px' }}>Settings</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'14px', margin:0 }}>Customize your Marga Rakshak experience. All changes apply instantly across the whole site.</p>
        </div>

        {/* ── Account ─────────────────────── */}
        <Section title="Account" icon="👤">
          <div style={{ display:'flex', alignItems:'center', gap:'20px', padding:'8px 0' }}>
            <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'22px', fontWeight:800, flexShrink:0 }}>
              {(user?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
            </div>
            <div>
              <p style={{ margin:0, fontWeight:800, fontSize:'18px', color:'var(--text-primary)' }}>{user?.full_name || 'User'}</p>
              <p style={{ margin:'3px 0 6px', fontSize:'13px', color:'var(--text-secondary)' }}>{user?.email}</p>
              <span style={{ display:'inline-block', padding:'3px 12px', borderRadius:'999px', background:'var(--accent-light)', color:'var(--accent-text)', fontSize:'12px', fontWeight:700, textTransform:'capitalize' }}>
                {user?.role === 'police' ? '🚔 Police Officer' : '🧑 Citizen'}
              </span>
            </div>
          </div>
        </Section>

        {/* ── Appearance & Theme ─────────── */}
        <Section title="Appearance & Theme" icon="🎨">
          <p style={{ margin:'0 0 6px', fontSize:'13px', color:'var(--text-secondary)', lineHeight:1.6 }}>
            Choose a color theme. Changes apply <strong style={{ color:'var(--text-primary)' }}>instantly across the whole website</strong>. 
            The <strong style={{ color:'var(--text-primary)' }}>navbar always stays white</strong> to maintain brand identity.
          </p>
          <div style={{ padding:'10px 14px', background:'var(--accent-light)', borderRadius:'10px', marginBottom:'28px' }}>
            <p style={{ margin:0, fontSize:'12px', color:'var(--accent-text)', fontWeight:600 }}>
              ✅ Currently active: <strong>{THEMES[themeId]?.emoji} {THEMES[themeId]?.label}</strong> — saved automatically.
            </p>
          </div>

          {Object.entries(groupedThemes).map(([group, themes]) => (
            <div key={group} style={{ marginBottom:'32px' }}>
              <p style={{ margin:'0 0 14px', fontSize:'11px', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'1px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ flex:1, height:'1px', background:'var(--border)', display:'inline-block' }}/>
                {group} Themes
                <span style={{ flex:1, height:'1px', background:'var(--border)', display:'inline-block' }}/>
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'14px' }}>
                {themes.map(t => {
                  const isActive = themeId === t.id
                  return (
                    <button key={t.id} onClick={() => setThemeId(t.id)} style={{
                      border: `2px solid ${isActive ? t['--accent'] : t['--border']}`,
                      borderRadius:'16px', padding:'16px', cursor:'pointer',
                      background: t['--bg-card'], textAlign:'left',
                      boxShadow: isActive ? `0 0 0 4px ${t['--accent']}33` : `0 1px 4px rgba(0,0,0,0.06)`,
                      position:'relative', width:'100%', outline:'none',
                    }}>
                      {/* Mini UI preview */}
                      <div style={{ display:'flex', gap:'6px', marginBottom:'12px', height:'36px' }}>
                        <div style={{ width:'28px', height:'100%', borderRadius:'8px', background:t['--bg-secondary'], border:`1px solid ${t['--border']}` }}/>
                        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'4px', paddingTop:'2px' }}>
                          <div style={{ height:'9px', borderRadius:'4px', background:t['--accent'], width:'65%' }}/>
                          <div style={{ height:'7px', borderRadius:'4px', background:t['--border'], width:'100%' }}/>
                          <div style={{ height:'7px', borderRadius:'4px', background:t['--border'], width:'75%' }}/>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div>
                          <p style={{ margin:0, fontSize:'13px', fontWeight:700, color:t['--text-primary'] }}>{t.emoji} {t.label}</p>
                          <p style={{ margin:'2px 0 0', fontSize:'11px', color:t['--text-muted'] }}>{t.group}</p>
                        </div>
                        {isActive && (
                          <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:t['--accent'], display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </Section>

        {/* ── Notifications ──────────────── */}
        <Section title="Notifications" icon="🔔">
          <Toggle label="Report Status Updates" desc="Get notified when your report is verified or rejected by a police officer" value={prefs.notif_reports !== false} onChange={v => updatePref('notif_reports', v)}/>
          <Toggle label="Challan Alerts" desc="Receive alerts when a new challan is issued to your registered vehicles" value={prefs.notif_challans !== false} onChange={v => updatePref('notif_challans', v)}/>
          <Toggle label="Appeal Decisions" desc="Know when your challan appeal has been accepted or rejected" value={prefs.notif_appeals !== false} onChange={v => updatePref('notif_appeals', v)}/>
          <Toggle label="Reward Points" desc="Notifications when you earn or successfully redeem reward points" value={prefs.notif_rewards !== false} onChange={v => updatePref('notif_rewards', v)}/>
          <Toggle label="System Announcements" desc="Important updates, maintenance notices, and news from Marga Rakshak" value={prefs.notif_system !== false} onChange={v => updatePref('notif_system', v)}/>
        </Section>

        {/* ── Privacy ────────────────────── */}
        <Section title="Privacy & Data" icon="🔒">
          <Toggle label="Show Profile on Leaderboard" desc="Allow your name and trust score to appear on the public civic leaderboard" value={prefs.privacy_leaderboard !== false} onChange={v => updatePref('privacy_leaderboard', v)}/>
          <Toggle label="GPS Location for Reports" desc="Allow the app to auto-fill your GPS coordinates when submitting traffic reports" value={prefs.privacy_location !== false} onChange={v => updatePref('privacy_location', v)}/>
          <Toggle label="Anonymized Analytics" desc="Share anonymized usage statistics to help improve the Marga Rakshak platform" value={prefs.privacy_analytics !== false} onChange={v => updatePref('privacy_analytics', v)}/>
        </Section>

        {/* ── Accessibility ──────────────── */}
        <Section title="Accessibility" icon="♿">
          <Toggle label="Reduce Motion" desc="Disable animations, transitions, and auto-refresh across the app" value={!!prefs.a11y_reduce_motion} onChange={v => updatePref('a11y_reduce_motion', v)}/>
          <Toggle label="Large Text Mode" desc="Increase the base font size to 18px for better readability" value={!!prefs.a11y_large_text} onChange={v => {
            updatePref('a11y_large_text', v)
            document.documentElement.style.fontSize = v ? '18px' : ''
          }}/>
          <Toggle label="Enhanced Focus Rings" desc="Show stronger keyboard focus indicators for better navigation" value={!!prefs.a11y_focus} onChange={v => updatePref('a11y_focus', v)}/>
        </Section>

        {/* ── Danger Zone ────────────────── */}
        <Section title="Danger Zone" icon="⚠️">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0' }}>
            <div>
              <p style={{ margin:0, fontWeight:700, fontSize:'15px', color:'var(--danger)' }}>Reset All Preferences</p>
              <p style={{ margin:'3px 0 0', fontSize:'12px', color:'var(--text-muted)' }}>Clears all saved settings, resets to Classic White theme, and reloads the page.</p>
            </div>
            <button onClick={() => {
              localStorage.removeItem('mr-prefs')
              localStorage.removeItem('mr-theme')
              window.location.reload()
            }} style={{ padding:'10px 22px', borderRadius:'10px', border:'1.5px solid var(--danger)', background:'transparent', color:'var(--danger)', fontSize:'13px', fontWeight:700, cursor:'pointer', flexShrink:0, marginLeft:'24px' }}>
              Reset
            </button>
          </div>
        </Section>

        {/* ── Creator Card ──────────────────────── */}
        <div style={{
          borderRadius: '20px', overflow: 'hidden',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
          boxShadow: '0 8px 40px rgba(99,102,241,0.22)',
          marginBottom: '24px',
          position: 'relative',
        }}>
          {/* Decorative blobs */}
          <div style={{ position:'absolute', width:'220px', height:'220px', borderRadius:'50%', background:'rgba(99,102,241,0.15)', top:'-60px', right:'-40px', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', width:'160px', height:'160px', borderRadius:'50%', background:'rgba(139,92,246,0.10)', bottom:'-40px', left:'-30px', pointerEvents:'none' }}/>

          <div style={{ position:'relative', padding:'32px 36px', display:'flex', flexWrap:'wrap', alignItems:'center', gap:'24px' }}>
            {/* Avatar */}
            <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', fontWeight:900, color:'#fff', flexShrink:0, boxShadow:'0 4px 20px rgba(99,102,241,0.4)' }}>Y</div>

            {/* Info */}
            <div style={{ flex:1, minWidth:'200px' }}>
              <p style={{ margin:'0 0 2px', fontSize:'11px', fontWeight:700, color:'rgba(167,139,250,0.9)', letterSpacing:'1.4px', textTransform:'uppercase' }}>Built & Designed by</p>
              <p style={{ margin:'0 0 16px', fontSize:'22px', fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>Yuvan Vishnu Pandi</p>

              {/* Social links */}
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                {[
                  { href:'https://github.com/yuvanvishnupandi', label:'GitHub', bg:'#24292e', icon:'⌥' },
                  { href:'https://www.linkedin.com/in/yuvanvishnupandi', label:'LinkedIn', bg:'#0a66c2', icon:'in' },
                  { href:'https://www.instagram.com/yuvvvnnnnnn/', label:'Instagram', bg:'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', icon:'📸' },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noreferrer" style={{
                    display:'inline-flex', alignItems:'center', gap:'7px',
                    padding:'7px 16px', borderRadius:'999px',
                    background: s.bg, color:'#fff',
                    fontSize:'12px', fontWeight:700, textDecoration:'none',
                    boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
                    transition:'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 18px rgba(0,0,0,0.35)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.3)' }}
                  >
                    <span>{s.icon}</span> {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Made with love */}
            <div style={{ textAlign:'center', flexShrink:0 }}>
              <p style={{ margin:'0 0 4px', fontSize:'28px' }}>💗</p>
              <p style={{ margin:0, fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.8px', textTransform:'uppercase' }}>Made with love</p>
              <p style={{ margin:'2px 0 0', fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.35)' }}>in India 🇮🇳</p>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', padding:'12px 36px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' }}>
            <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>Marga Rakshak · © 2026</p>
            <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>Tamil Nadu Traffic Violation Reporting System</p>
          </div>
        </div>

      </div>
    </div>
  )
}
