import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config';
const API = API_BASE_URL;

const Icon = {
  inbox: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m12 0l-4 4m0 0l-4-4"/></svg>,
  clock: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/></svg>,
  check: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  x: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  money: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
  doc: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  review: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  scale: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5 5 0 006.9 4.9M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5 5 0 01-6.9 4.9M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>,
  search: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/></svg>,
  chart: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  challan: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
  book: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
  arrow: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/></svg>,
  shield: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
}

// Mac-style terminal for the autonomous agent
function MacTerminal() {
  const [lines, setLines] = useState([])
  const terminalRef = useRef(null)
  const indexRef = useRef(0)

  const allLines = [
    { prompt: 'marga-rakshak [main✓] $', cmd: 'python agents.py --mode=autonomous', type: 'cmd' },
    { text: 'Initializing Marga Rakshak Agentic Core v2.1...', type: 'system', color: '#6b7280' },
    { text: 'Loading AI models: Gemini 2.5-Flash ✓  GPT-4o-mini ✓  Mistral-Nemo ✓', type: 'success', color: '#22c55e' },
    { prompt: '[VISION AGENT]', cmd: 'Scanning incoming reports queue...', type: 'agent', agentColor: '#38bdf8' },
    { text: '  → Found 14 new image submissions in the last 60 minutes', type: 'info', color: '#94a3b8' },
    { text: '  → Running OCR pipeline on vehicle plates...', type: 'info', color: '#94a3b8' },
    { text: '  → Plate recognition accuracy: 97.4%', type: 'success', color: '#22c55e' },
    { prompt: '[RTO AGENT]', cmd: 'Cross-referencing plates with TN-RTO database...', type: 'agent', agentColor: '#fbbf24' },
    { text: '  → Validated 12/14 plates against live RTO records', type: 'success', color: '#22c55e' },
    { text: '  → 2 plates flagged as unregistered — escalating to human review', type: 'warning', color: '#f97316' },
    { prompt: '[RULE ENGINE]', cmd: 'Applying Motor Vehicles Act section checks...', type: 'agent', agentColor: '#c084fc' },
    { text: '  → Section 183 (Speeding): 6 violations detected', type: 'info', color: '#94a3b8' },
    { text: '  → Section 119 (Signal Jumping): 5 violations detected', type: 'info', color: '#94a3b8' },
    { text: '  → Section 129 (No Helmet): 3 violations detected', type: 'info', color: '#94a3b8' },
    { prompt: '[DISPATCHER]', cmd: 'Auto-triaging by confidence score...', type: 'agent', agentColor: '#34d399' },
    { text: '  → 10 reports auto-verified (confidence ≥ 90%)', type: 'success', color: '#22c55e' },
    { text: '  → 4 reports queued for manual review (confidence < 90%)', type: 'warning', color: '#f97316' },
    { prompt: '[HOTSPOT AI]', cmd: 'Running predictive dispatch model for Chennai...', type: 'agent', agentColor: '#f87171' },
    { text: '  → T Nagar Anna Salai: 98% risk — Peak 18:00-21:00 (Red Light Violation)', type: 'critical', color: '#ef4444' },
    { text: '  → ECR Checkpoint: 87% risk — Peak 17:30-20:30 (Speeding)', type: 'warning', color: '#f97316' },
    { text: '', type: 'blank' },
    { text: '✅ Autonomous cycle complete. Next run in 300s.', type: 'done', color: '#22c55e' },
    { prompt: 'marga-rakshak [main✓] $', cmd: '█', type: 'cursor' },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      if (indexRef.current < allLines.length) {
        const currentItem = allLines[indexRef.current];
        setLines(prev => [...prev, currentItem]);
        indexRef.current++;
      } else {
        clearInterval(timer);
      }
    }, 600);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])

  return (
    <div style={{
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      marginBottom: '32px',
      fontFamily: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace',
      fontSize: '13px',
    }}>
      {/* Mac titlebar */}
      <div style={{
        background: '#3c3c3c',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid #2a2a2a',
      }}>
        <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#ff5f57', boxShadow: '0 0 0 1px rgba(0,0,0,0.15)' }} />
        <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#ffbd2e', boxShadow: '0 0 0 1px rgba(0,0,0,0.15)' }} />
        <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#28ca41', boxShadow: '0 0 0 1px rgba(0,0,0,0.15)' }} />
        <span style={{ marginLeft: '8px', color: '#999', fontSize: '12px', fontWeight: 500, flex: 1, textAlign: 'center' }}>
          marga-rakshak — autonomous-agents — bash — 110×28
        </span>
      </div>

      {/* Terminal body */}
      <div ref={terminalRef} style={{
        background: '#1e1e1e',
        padding: '16px 20px',
        minHeight: '260px',
        maxHeight: '320px',
        overflowY: 'auto',
        lineHeight: '1.65',
        scrollbarWidth: 'thin',
        scrollbarColor: '#444 #1e1e1e',
      }}>
        {/* Initial prompt line */}
        <div style={{ color: '#ccc', marginBottom: '4px' }}>
          <span style={{ color: '#6ee7b7' }}>~/dev/marga-rakshak</span>{' '}
          <span style={{ color: '#818cf8' }}>[main✓]</span>{' '}
          <span style={{ color: '#e5e7eb' }}>$</span>{' '}
        </div>

        {lines.map((line, i) => {
          if (line.type === 'blank') return <div key={i} style={{ height: '8px' }} />
          if (line.type === 'cmd') return (
            <div key={i} style={{ marginBottom: '2px' }}>
              <span style={{ color: '#6ee7b7' }}>~/dev/marga-rakshak</span>{' '}
              <span style={{ color: '#818cf8' }}>[main✓]</span>{' '}
              <span style={{ color: '#e5e7eb' }}>$ </span>
              <span style={{ color: '#f8fafc' }}>{line.cmd}</span>
            </div>
          )
          if (line.type === 'agent') return (
            <div key={i} style={{ marginBottom: '2px' }}>
              <span style={{ color: line.agentColor, fontWeight: 700 }}>{line.prompt}</span>{' '}
              <span style={{ color: '#f8fafc' }}>{line.cmd}</span>
            </div>
          )
          if (line.type === 'cursor') return (
            <div key={i} style={{ marginBottom: '2px' }}>
              <span style={{ color: '#6ee7b7' }}>~/dev/marga-rakshak</span>{' '}
              <span style={{ color: '#818cf8' }}>[main✓]</span>{' '}
              <span style={{ color: '#e5e7eb' }}>$ </span>
              <span style={{
                display: 'inline-block', width: '8px', height: '14px',
                background: '#e5e7eb', verticalAlign: 'text-bottom',
                animation: 'blink 1s step-end infinite'
              }} />
            </div>
          )
          if (line.type === 'done') return (
            <div key={i} style={{ color: line.color, fontWeight: 700, marginTop: '4px' }}>{line.text}</div>
          )
          return (
            <div key={i} style={{ color: line.color || '#ccc', paddingLeft: line.type === 'info' || line.type === 'success' || line.type === 'warning' || line.type === 'critical' ? '0' : '0' }}>
              {line.text}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  )
}

function PoliceCommand({ user }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalProcessed: 0, pendingReviews: 0, finesCollected: 0,
    activeChallans: 0, verifiedReports: 0, rejectedReports: 0
  })
  const [hotspots, setHotspots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const [statsRes, hotspotsRes] = await Promise.allSettled([
        fetch(`${API}/api/analytics/police-summary`, { headers }),
        fetch(`${API}/api/hotspots/predictive`, { headers })
      ])

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const d = (await statsRes.value.json()).data || {}
        setStats({
          totalProcessed: Number(d.total_processed) || 0,
          pendingReviews: Number(d.pending_count) || 0,
          finesCollected: Number(d.fines_collected) || 0,
          activeChallans: Number(d.active_challans) || 0,
          verifiedReports: Number(d.verified_count) || 0,
          rejectedReports: Number(d.rejected_count) || 0,
        })
      }

      if (hotspotsRes.status === 'fulfilled' && hotspotsRes.value.ok) {
        const hd = await hotspotsRes.value.json()
        setHotspots(Array.isArray(hd.predictions) ? hd.predictions : [])
      }

    } catch (err) {
      console.error('Police dashboard error:', err)
      setError('Failed to load dashboard data. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    window.open(`${API}/api/reports/police/export-csv`, '_blank')
  }

  const finesDisplay = (() => {
    try { return `₹${Number(stats.finesCollected).toLocaleString('en-IN')}` }
    catch { return `₹${stats.finesCollected}` }
  })()

  const statCards = [
    { label: 'Total Processed', value: stats.totalProcessed, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: Icon.doc },
    { label: 'Pending Review', value: stats.pendingReviews, color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: Icon.clock },
    { label: 'Verified', value: stats.verifiedReports, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: Icon.check },
    { label: 'Rejected', value: stats.rejectedReports, color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', icon: Icon.x },
    { label: 'Fines Collected', value: finesDisplay, color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', icon: Icon.money },
    { label: 'Active Challans', value: stats.activeChallans, color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', icon: Icon.doc },
  ]

  const quickActions = [
    { title: 'Overdue Log', desc: 'Habitual offenders & overdue challans', path: '/police/overdue-log', accent: '#b91c1c', bg: '#fef2f2', border: '#fecaca', icon: Icon.challan },
    { title: 'Review Pending Reports', desc: `${stats.pendingReviews} report${stats.pendingReviews !== 1 ? 's' : ''} awaiting verification`, path: '/police/review-reports', accent: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: Icon.review },
    { title: 'Review Appeals', desc: 'Citizens disputing rejected reports', path: '/police/review-appeals', accent: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', icon: Icon.scale },
    { title: 'Vehicle Search', desc: 'Look up plates and violation history', path: '/vehicle-search', accent: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', icon: Icon.search },
    { title: 'Analytics Dashboard', desc: 'Heatmaps, charts, violation trends', path: '/analytics', accent: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: Icon.chart },
    { title: 'Officer Performance', desc: 'Stats from Officer_Performance_View', path: '/police/officer-stats', accent: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', icon: Icon.shield },
    { title: 'Issue New Challan', desc: 'Create a challan for a verified violation', path: '/police/review-reports', accent: '#374151', bg: '#f9fafb', border: '#e5e7eb', icon: Icon.doc },
    { title: 'Traffic Rules & Laws', desc: 'MV Act sections and penalty schedule', path: '/rules', accent: '#374151', bg: '#f9fafb', border: '#e5e7eb', icon: Icon.book },
    { title: 'Road Conditions API', desc: 'Live Weather & Hazard Assessment', path: '/road-conditions', accent: '#38bdf8', bg: '#e0f2fe', border: '#bae6fd', icon: Icon.chart },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Loading command centre…</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: '#b91c1c', fontSize: '16px', marginBottom: '16px' }}>{error}</p>
        <button onClick={fetchAll} style={{ padding: '10px 24px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
          Retry
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: '88px', fontFamily: 'inherit' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 40px 64px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1.5px solid var(--border)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 0 3px rgba(34,197,94,0.18)' }} />
              <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Command Centre Active</span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
              Welcome, Officer {user?.full_name || user?.name || 'Officer'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Central Command &amp; Verification Centre — Tamil Nadu Traffic Police
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(30,58,138,0.2)' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e40af'}
            onMouseLeave={e => e.currentTarget.style.background = '#1e3a8a'}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export Records (CSV)
          </button>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '16px', marginBottom: '32px' }}>
          {statCards.map((c, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', border: `1.5px solid ${c.border}`, borderRadius: '14px', padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', background: c.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, flexShrink: 0 }}>
                {c.icon}
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</p>
                <p style={{ fontSize: '24px', fontWeight: 900, color: c.color, margin: 0, lineHeight: 1 }}>{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* MAC TERMINAL — Autonomous Agent Console */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Autonomous Agentic Workflow Console
            </h2>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, border: '1px solid #bbf7d0' }}>
              LIVE
            </span>
          </div>
          <MacTerminal />
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {quickActions.map((a, i) => (
              <div key={i}
                onClick={() => navigate(a.path)}
                style={{ background: 'var(--bg-card)', border: `1.5px solid ${a.border}`, borderRadius: '14px', padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'flex-start', gap: '14px' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${a.accent}22` }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ width: '36px', height: '36px', background: a.bg, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.accent, flexShrink: 0 }}>
                  {a.icon}
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>{a.title}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Hotspot Dispatcher */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 12px #ef4444', animation: 'pulse 2s infinite' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Duty Dispatch Alerts: AI Hotspot Predictions
            </h2>
            <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, border: '1px solid #fecaca' }}>PROACTIVE DISPATCH</span>
          </div>

          {hotspots.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '32px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No hotspot predictions available. The AI is analyzing traffic patterns...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {hotspots.map((spot, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)',
                  border: spot.riskLevel === 'Critical' ? '2px solid #ef4444' : '2px solid #f59e0b',
                  borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: spot.riskLevel === 'Critical' ? '#ef4444' : '#f59e0b' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{spot.location}</h3>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Peak Risk: <span style={{ color: 'var(--accent)' }}>{spot.peakTime}</span>
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: spot.riskLevel === 'Critical' ? '#ef4444' : '#f59e0b', lineHeight: 1 }}>{spot.confidence}%</div>
                      <div style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.5px', margin: '4px 0 0' }}>AI Confidence</div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '12px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Recommended Action</p>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{spot.recommendedAction}</p>
                  </div>

                  {spot.insight && (
                    <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#0369a1', background: '#f0f9ff', padding: '8px 12px', borderRadius: '6px', fontStyle: 'italic', borderLeft: '3px solid #0ea5e9' }}>
                      💡 {spot.insight}
                    </p>
                  )}

                  <button style={{
                    width: '100%', padding: '12px',
                    background: spot.riskLevel === 'Critical' ? '#ef4444' : '#f59e0b',
                    color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', transition: 'opacity 0.2s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    onClick={e => { e.currentTarget.textContent = '✓ Dispatch Acknowledged'; e.currentTarget.style.background = '#10b981'; e.currentTarget.disabled = true; }}
                  >
                    Acknowledge Dispatch
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default PoliceCommand
