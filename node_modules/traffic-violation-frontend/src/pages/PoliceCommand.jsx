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
  const [hotspots, setHotspots] = useState([])
  const [loading, setLoading] = useState(true)

   useEffect(() => { fetchAll() }, [])

   const fetchAll = async () => {
     try {
       setLoading(true)
       const token = localStorage.getItem('token')
       const headers = token ? { Authorization: `Bearer ${token}` } : {}
       
        const [statsRes, violRes, appealsRes, hotspotsRes] = await Promise.allSettled([
          fetch(`${API}/api/analytics/police-summary`, { headers }),
          fetch(`${API}/api/analytics/violation-types`, { headers }),
          fetch(`${API}/api/appeals/police/pending`, { headers }),
          fetch(`${API}/api/hotspots/predictive`, { headers })
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

       if (hotspotsRes.status === 'fulfilled' && hotspotsRes.value.ok) {
         const hd = await hotspotsRes.value.json()
         setHotspots(hd.predictions || [])
       }

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





        {/* AI HOTSPOT DISPATCHER */}
        <div style={{ marginTop: '28px', animation: 'fadeInUp 0.6s ease-out 0.4s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 12px #ef4444', animation: 'pulse 2s infinite' }}></div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Duty Dispatch Alerts: AI Hotspot Predictions</h2>
            <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, border: '1px solid #fecaca' }}>PROACTIVE DISPATCH</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {hotspots.map((spot, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)', border: spot.riskLevel === 'Critical' ? '2px solid #ef4444' : '2px solid #f59e0b',
                borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: spot.riskLevel === 'Critical' ? '#ef4444' : '#f59e0b' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{spot.location}</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Peak Risk: <span style={{ color: 'var(--accent)' }}>{spot.peakTime}</span></p>
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
                  width: '100%', padding: '12px', background: spot.riskLevel === 'Critical' ? '#ef4444' : '#f59e0b',
                  color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }} onMouseEnter={e => e.currentTarget.style.opacity = 0.9} onMouseLeave={e => e.currentTarget.style.opacity = 1}
                   onClick={(e) => { e.currentTarget.innerText = '✓ Dispatch Acknowledged'; e.currentTarget.style.background = '#10b981'; e.currentTarget.disabled = true; }}
                >
                  Acknowledge Dispatch
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default PoliceCommand
