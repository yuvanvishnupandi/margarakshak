import { useState, useEffect } from 'react'
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

function PoliceCommand({ user }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalProcessed:0, pendingReviews:0, finesCollected:0, activeChallans:0, verifiedReports:0, rejectedReports:0 })
  const [appeals, setAppeals] = useState([])
  const [topViolations, setTopViolations] = useState([])
  const [loading, setLoading] = useState(true)

   useEffect(() => { fetchAll() }, [])

   const fetchAll = async () => {
     try {
       setLoading(true)
       const token = localStorage.getItem('token')
       const headers = token ? { Authorization: `Bearer ${token}` } : {}
       
        const [statsRes, violRes, appealsRes] = await Promise.allSettled([
          fetch(`${API}/api/analytics/police-summary`, { headers }),
          fetch(`${API}/api/analytics/violation-types`, { headers }),
          fetch(`${API}/api/appeals/police/pending`, { headers })
        ])
       
       if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
         const d = (await statsRes.value.json()).data || {}
         setStats({ 
           totalProcessed: d.total_processed||0, 
           pendingReviews: d.pending_count||0, 
           finesCollected: d.fines_collected||0, 
           activeChallans: d.active_challans||0, 
           verifiedReports: d.verified_count||0, 
           rejectedReports: d.rejected_count||0 
         })
       }
       
       if (violRes.status === 'fulfilled' && violRes.value.ok) {
         const vd = (await violRes.value.json()).data || []
         setTopViolations(vd.slice(0, 5))
       }
       
       let allAppeals = []
       if (appealsRes.status === 'fulfilled' && appealsRes.value.ok) {
         const data = await appealsRes.value.json()
         allAppeals = data.appeals || []
       }
       const pendingAppeals = Array.isArray(allAppeals) 
         ? allAppeals.filter(a => a.status === 'Pending')
         : []
       setAppeals(pendingAppeals.slice(0, 5))

     } catch(err) { 
       console.error('Police dashboard:', err)
       setAppeals([])
     }
      finally { setLoading(false) }
    }

  const handleExportCSV = () => {
    window.open(`${API}/api/reports/police/export-csv`, '_blank')
  }

   const statCards = [
    { label: 'Total Processed', value: stats.totalProcessed, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', icon: Icon.doc },
    { label: 'Pending Review', value: stats.pendingReviews, color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: Icon.clock },
    { label: 'Verified', value: stats.verifiedReports, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: Icon.check },
    { label: 'Rejected', value: stats.rejectedReports, color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', icon: Icon.x },
    { label: 'Fines Collected', value: `₹${stats.finesCollected.toLocaleString('en-IN')}`, color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', icon: Icon.money },
    { label: 'Active Challans', value: stats.activeChallans, color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', icon: Icon.doc },
  ]

  const quickActions = [
    { title: 'Overdue Log', desc: 'Habitual offenders & overdue challans', path: '/police/overdue-log', accent: '#b91c1c', bg: '#fef2f2', border: '#fecaca', icon: Icon.challan },
    { title: 'Review Pending Reports', desc: `${stats.pendingReviews} report${stats.pendingReviews!==1?'s':''} awaiting verification`, path: '/police/review-reports', accent: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: Icon.review },
    { title: 'Review Appeals', desc: 'Citizens disputing rejected reports', path: '/police/review-appeals', accent: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', icon: Icon.scale },
    { title: 'Vehicle Search', desc: 'Look up plates and violation history', path: '/vehicle-search', accent: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', icon: Icon.search },
    { title: 'Analytics Dashboard', desc: 'Heatmaps, charts, violation trends', path: '/analytics', accent: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: Icon.chart },
    { title: 'Officer Performance', desc: 'Stats from Officer_Performance_View', path: '/police/officer-stats', accent: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', icon: Icon.shield },
    { title: 'Issue New Challan', desc: 'Create a challan for a verified violation', path: '/police/review-reports', accent: '#374151', bg: '#f9fafb', border: '#e5e7eb', icon: Icon.doc },
    { title: 'Traffic Rules & Laws', desc: 'MV Act sections and penalty schedule', path: '/rules', accent: '#374151', bg: '#f9fafb', border: '#e5e7eb', icon: Icon.book },
    { title: 'Road Conditions API', desc: 'Live Weather & Hazard Assessment', path: '/road-conditions', accent: '#38bdf8', bg: '#e0f2fe', border: '#bae6fd', icon: Icon.chart },
  ]

   const statusColor = s => ({ Pending:'#b45309', Verified:'#15803d', Rejected:'#b91c1c', 'Challan Issued':'#6d28d9' }[s]||'#374151')
   const statusBg = s => ({ Pending:'#fffbeb', Verified:'#f0fdf4', Rejected:'#fef2f2', 'Challan Issued':'#f5f3ff' }[s]||'#f9fafb')

   const appealStatusStyles = {
     Pending: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
     'Under Review': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
     Accepted: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
     Rejected: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
   }
   const getAppealStatus = (s) => appealStatusStyles[s] || { bg:'#f9fafb', color: 'var(--text-secondary)', border:'#e5e7eb' }

   if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:'40px', height:'40px', border:'3px solid #e5e7eb', borderTopColor:'#1d4ed8', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 14px' }}/>
        <p style={{ color: 'var(--text-secondary)', fontSize:'14px', margin:0 }}>Loading command centre…</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', paddingTop:'88px', fontFamily:'inherit' }}>

      <div style={{ maxWidth:'1440px', margin:'0 auto', padding:'32px 40px 64px' }}>

        {}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'32px', paddingBottom:'24px', borderBottom:'1.5px solid var(--border)' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--success)', boxShadow:'0 0 0 3px rgba(34,197,94,0.18)' }}/>
              <span style={{ fontSize:'11px', color:'var(--success)', fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase' }}>Command Centre Active</span>
            </div>
            <h1 style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:900, color:'var(--text-primary)', margin:'0 0 4px', letterSpacing:'-0.3px' }}>
              Welcome, Officer {user?.full_name || user?.name || 'Officer'}
            </h1>
            <p style={{ color:'var(--text-secondary)', fontSize:'14px', margin:0 }}>
              Central Command &amp; Verification Centre — Tamil Nadu Traffic Police
            </p>
          </div>
          <button 
            onClick={handleExportCSV}
            style={{
              display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px',
              background:'#1e3a8a', color:'#fff', border:'none', borderRadius:'10px',
              fontSize:'13px', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 12px rgba(30,58,138,0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e40af'}
            onMouseLeave={e => e.currentTarget.style.background = '#1e3a8a'}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export Records (CSV)
          </button>
        </div>

        {}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:'16px', marginBottom:'28px' }}>
          {statCards.map((c, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', border:`1.5px solid ${c.border}`, borderRadius:'14px', padding:'20px 22px', display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'42px', height:'42px', background:c.bg, borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', color:c.color, flexShrink:0 }}>
                {c.icon}
              </div>
              <div>
                <p style={{ fontSize:'11px', color:'#64748b', fontWeight:600, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.5px' }}>{c.label}</p>
                <p style={{ fontSize:'24px', fontWeight:900, color:c.color, margin:0, lineHeight:1 }}>{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px', animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>

          {}
          <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)', borderRadius:'18px', padding:'26px' }}>
            <h2 style={{ fontSize:'15px', fontWeight:800, color:'var(--text-primary)', margin:'0 0 18px', textTransform:'uppercase', letterSpacing:'0.8px' }}>Quick Actions</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {quickActions.map((a, i) => (
                <button key={i} onClick={() => navigate(a.path)} style={{
                  display:'flex', alignItems:'center', gap:'14px',
                  padding:'13px 16px', background:'var(--bg-primary)',
                  border:'1.5px solid var(--border)', borderRadius:'10px',
                  cursor:'pointer', textAlign:'left', transition:'all 0.18s',
                  width:'100%',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = a.bg; e.currentTarget.style.borderColor = a.border; e.currentTarget.style.transform = 'translateX(3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateX(0)' }}
                >
                  <div style={{ width:'34px', height:'34px', background:'var(--bg-card)', border:`1.5px solid ${a.border}`, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:a.accent, flexShrink:0 }}>
                    {a.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:'13px', fontWeight:700, color:'var(--text-primary)' }}>{a.title}</p>
                    <p style={{ margin:0, fontSize:'11px', color:'var(--text-secondary)', marginTop:'2px' }}>{a.desc}</p>
                  </div>
                  <div style={{ color:'var(--text-muted)', flexShrink:0 }}>{Icon.arrow}</div>
                </button>
              ))}
            </div>
          </div>

          {}
          <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)', borderRadius:'18px', padding:'26px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div>
                <h2 style={{ fontSize:'15px', fontWeight:800, color:'var(--text-primary)', margin:0, textTransform:'uppercase', letterSpacing:'0.8px' }}>Pending Appeals</h2>
                <p style={{ fontSize:'12px', color:'var(--text-secondary)', margin:'4px 0 0' }}>Citizen challan disputes awaiting review</p>
              </div>
              <button onClick={() => navigate('/police/review-appeals')} style={{ fontSize:'12px', color:'var(--accent)', background:'none', border:'none', cursor:'pointer', padding:0, whiteSpace:'nowrap', fontWeight:700 }}>
                View All →
              </button>
            </div>
            {appeals.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 0' }}>
                <div style={{ width:'56px', height:'56px', background:'var(--bg-primary)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', color:'var(--text-muted)', border:'1.5px solid var(--border)' }}>{Icon.inbox}</div>
                <p style={{ color:'var(--text-secondary)', fontSize:'13px', margin:0, fontWeight:500 }}>No pending appeals</p>
                <p style={{ color:'var(--text-muted)', fontSize:'11px', margin:'4px 0 0' }}>All appeals have been reviewed</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                {appeals.map((appeal) => {
                  const s = getAppealStatus(appeal.status)
                  return (
                    <div key={appeal.appeal_id} style={{ 
                      display:'flex', alignItems:'center', gap:'12px', 
                      padding:'14px 16px', borderRadius:'12px', background:'var(--bg-primary)',
                      border:'1.5px solid transparent',
                      transition:'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = s.border; e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}
                    >
                      <div style={{ 
                        width:'10px', height:'10px', borderRadius:'50%', 
                        background:s.color, flexShrink:0,
                        boxShadow:`0 0 0 3px ${s.bg}`
                      }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                          <p style={{ margin:0, fontSize:'13px', fontWeight:700, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{appeal.rule_name || 'Challan Appeal'}</p>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'var(--text-secondary)' }}>
                          <span style={{ fontFamily:'monospace', fontSize:'12px', fontWeight:600, color:'var(--text-primary)', background:'var(--border)', padding:'2px 6px', borderRadius:'4px' }}>{appeal.plate_no || 'N/A'}</span>
                          <span>·</span>
                          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{appeal.citizen_name || 'Unknown'}</span>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
                        <span style={{ 
                          fontSize:'10.5px', padding:'4px 11px', borderRadius:'999px', 
                          background:s.bg, color:s.color, fontWeight:800, 
                          letterSpacing:'0.4px', border:`1px solid ${s.border}`
                        }}>{appeal.status}</span>
                        {appeal.status === 'Pending' && (
                          <button
                            onClick={() => navigate('/police/review-appeals')}
                            style={{ 
                              fontSize:'11px', fontWeight:700, color:'var(--accent)',
                              background:'none', border:'none', cursor:'pointer',
                              whiteSpace:'nowrap'
                            }}
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>

          {}
          <div style={{ background: 'var(--bg-card)', border:'1.5px solid #e2e8f0', borderRadius:'18px', padding:'26px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div>
                <h2 style={{ fontSize:'15px', fontWeight:800, color: 'var(--text-primary)', margin:0, textTransform:'uppercase', letterSpacing:'0.8px' }}>Top Violation Types</h2>
                <p style={{ fontSize:'12px', color:'#64748b', margin:'4px 0 0' }}>Most reported offenses</p>
              </div>
              <div style={{ width:'32px', height:'32px', background:'#f1f5f9', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}>
                {Icon.chart}
              </div>
            </div>
            {topViolations.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 0' }}>
                <p style={{ color:'#94a3b8', fontSize:'13px', margin:0 }}>No violation data available yet</p>
                <p style={{ color:'#cbd5e1', fontSize:'11px', margin:'4px 0 0' }}>Data will appear once reports are verified</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {topViolations.map((v, i) => {
                  const max = topViolations[0]?.count || 1
                  const pct = Math.round((v.count / max) * 100)
                  const colors = ['#1d4ed8','#b45309','#15803d','#b91c1c','#6d28d9']
                  const color = colors[i] || '#64748b'
                  return (
                    <div key={i} style={{ 
                      background: 'var(--bg-primary)', 
                      borderRadius:'10px', 
                      padding:'14px 16px',
                      border:'1.5px solid #f1f5f9',
                      transition:'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.background = '#f8fafc' }}
                    >
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                        <span style={{ fontSize:'12.5px', fontWeight:700, color: 'var(--text-primary)' }}>{v.violation_type}</span>
                        <span style={{ fontSize:'13px', fontWeight:800, color }}>{v.count}</span>
                      </div>
                      <div style={{ height:'6px', background:'#e2e8f0', borderRadius:'999px', overflow:'hidden', position:'relative' }}>
                        <div style={{ 
                          height:'100%', width:`${pct}%`, 
                          background:`linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`, 
                          borderRadius:'999px',
                          transition:'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow:`0 0 8px ${color}40`
                        }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {}
          <div style={{ background:'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', borderRadius:'18px', padding:'26px' }}>
            <h2 style={{ fontSize:'15px', fontWeight:800, color:'#fff', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.8px' }}>Daily Duty Checklist</h2>
            <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.45)', margin:'0 0 20px' }}>Standard operating procedure</p>
            {[
              { done: stats.pendingReviews === 0, text: 'Clear all pending reports' },
              { done: true, text: 'System login verified' },
              { done: stats.pendingReviews < 5, text: `Pending queue < 5 (${stats.pendingReviews} pending)` },
              { done: true, text: 'Challan pipeline active' },
              { done: stats.verifiedReports > 0, text: 'Verified at least one report' },
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'5px', flexShrink:0, background: item.done ? '#22c55e' : 'rgba(255,255,255,0.08)', border: item.done ? '2px solid #16a34a' : '2px solid rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {item.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <p style={{ margin:0, fontSize:'13px', color: item.done ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.38)', fontWeight: item.done ? 500 : 400 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default PoliceCommand
