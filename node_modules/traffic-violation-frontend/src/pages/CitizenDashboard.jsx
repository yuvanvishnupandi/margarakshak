import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

import { API_BASE_URL } from '../config';
const API = API_BASE_URL;
// Replaced by automated script

function CitizenDashboard() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [challans, setChallans] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [fetchError, setFetchError] = useState(null)
  const [rewardPoints, setRewardPoints] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      setUser(userData)
      fetchChallans(userData.id)
      fetchReports(userData.id)
    } else {
      setFetchError('Please login to view your dashboard')
      setLoading(false)
    }
  }, [])

  const fetchChallans = async (citizenId) => {
    try {
      setFetchError(null)
      const res = await fetch(`${API_BASE_URL}/api/challans/citizen/${citizenId}`)
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setChallans(data.challans || [])
    } catch (err) {
      setFetchError(`Cannot connect to database. Is the server running? (${err.message})`)
      showError(err.message)
      setChallans([])
    }
  }

  const fetchReports = async (citizenId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/my-reports/${citizenId}`)
      if (!res.ok) throw new Error('Failed to fetch reports')
      const data = await res.json()
      setReports(data.reports || [])

      const token = localStorage.getItem('token')
      if (token) {
        try {
          const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
          })
          if (profileRes.ok) {
            const profile = await profileRes.json()
            setRewardPoints(profile.reward_points || 0)
            setWalletBalance(profile.wallet_balance || 0)
            const currentUser = JSON.parse(localStorage.getItem('user'))
            if (currentUser) {
              currentUser.reward_points = profile.reward_points || 0
              currentUser.wallet_balance = profile.wallet_balance || 0
              currentUser.trust_score = profile.trust_score !== undefined ? profile.trust_score : currentUser.trust_score
              localStorage.setItem('user', JSON.stringify(currentUser))
              setUser(currentUser) // Force React state update
            }
          }
        } catch (pe) { console.warn('Profile fetch skipped:', pe.message) }
      }
    } catch (err) {
      console.error('Fetch reports error:', err)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const handlePayChallan = async (challanId, amount) => {
    if (!confirm(`Pay fine of Rs.${amount}?`)) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/challans/pay/${challanId}`, { method: 'PUT' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Payment failed') }
      success('Payment successful! Challan marked as paid.')
      if (user) fetchChallans(user.id)
    } catch (err) { showError(err.message) }
  }

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Delete failed') }
      success('Report deleted successfully')
      if (user) fetchReports(user.id)
    } catch (err) { showError(err.message) }
  }

  const getStatusBadge = (status) => {
    const styles = {
      'Unpaid': 'bg-red-50 text-red-700 border-red-200',
      'Paid': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Overdue': 'bg-orange-50 text-orange-700 border-orange-200',
      'Pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Verified': 'bg-blue-50 text-blue-700 border-blue-200',
      'Rejected': 'bg-gray-50 text-gray-700 border-gray-200',
      'Challan Issued': 'bg-purple-50 text-purple-700 border-purple-200'
    }
    return styles[status] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-4">Loading your dashboard...</p>
      </div>
    </div>
  )

  if (fetchError) return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="text-center max-w-md px-4">
        <div className="text-6xl mb-4 text-red-600 font-bold">!</div>
        <h2 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold  mb-2">Connection Error</h2>
        <p style={{ color: 'var(--text-secondary)' }} className="mb-6">{fetchError}</p>
        <button onClick={() => user && fetchChallans(user.id)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
          Retry Connection
        </button>
      </div>
    </div>
  )

  const unpaidChallans = challans.filter(c => c.payment_status === 'Unpaid')
  const totalUnpaid = unpaidChallans.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0)
  const pendingReports = reports.filter(r => r.status === 'Pending')
  const thisMonthReports = reports.filter(r => {
    const d = new Date(r.reported_at); const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const verifiedRate = reports.length > 0
    ? Math.round((reports.filter(r => r.status === 'Verified' || r.status === 'Challan Issued').length / reports.length) * 100)
    : 0
  const topViolation = (() => {
    if (!reports.length) return 'N/A'
    const counts = {}
    reports.forEach(r => { counts[r.violation_type] = (counts[r.violation_type] || 0) + 1 })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? top[0] : 'N/A'
  })()
  const activeAreas = new Set(reports.map(r => r.location_address).filter(Boolean)).size

  const quickActions = [
    { icon: '📸', title: 'Submit a Report', desc: 'Report a traffic violation', path: '/submit-report' },
    { icon: '📋', title: 'My Reports', desc: 'Track all your submissions', path: '/my-reports' },
    { icon: '📑', title: 'My Challans', desc: 'View & pay pending fines', path: '/my-challans' },
    { icon: '🏆', title: 'Leaderboard', desc: 'Top citizens by Trust Score', path: '/leaderboard' },
    { icon: '🚗', title: 'My Vehicles', desc: 'Manage registered vehicles', path: '/my-vehicles' },
    { icon: '💳', title: 'Payment History', desc: 'View all paid challans', path: '/payment-history' },
    { icon: '🌦️', title: 'Road Conditions', desc: 'Live Weather & Hazard API', path: '/road-conditions' }
  ]

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', paddingTop:'120px', paddingBottom:'40px' }}>
      <div style={{ maxWidth:'1440px', margin:'0 auto', padding:'0 32px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom:'32px', paddingBottom:'24px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'16px' }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
                <div style={{ height:'4px', width:'48px', background:'var(--primary)', borderRadius:'99px' }}></div>
                <span style={{ fontSize:'11px', fontWeight:800, letterSpacing:'1.5px', color:'var(--primary)', textTransform:'uppercase' }}>Official Portal</span>
              </div>
              <h1 style={{ fontSize:'32px', fontWeight:900, color:'var(--text-primary)', margin:'0 0 8px', letterSpacing:'-0.5px' }}>Citizen Dashboard</h1>
              <p style={{ color:'var(--text-secondary)', fontSize:'15px', margin:0 }}>
                Welcome, <span style={{ fontWeight:700, color:'var(--text-primary)' }}>{user?.full_name || user?.name || 'Citizen'}</span>
              </p>
            </div>
            <div style={{ textAlign:'right', opacity:0.8, paddingBottom:'4px' }}>
              <p style={{ fontSize:'12px', color:'var(--text-secondary)', margin:0 }}>Department of Transport</p>
              <p style={{ fontSize:'13px', fontWeight:700, color:'var(--text-primary)', margin:0 }}>Government of Tamil Nadu</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px', marginBottom:'32px', animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
          {[
            { label:'Total Challans', value: challans.length, color:'var(--text-secondary)', bg:'var(--bg-card)', border:'var(--border)' },
            { label:'Unpaid Challans', value: unpaidChallans.length, color:'var(--danger)', bg:'var(--bg-card)', border:'var(--danger)' },
            { label:'Amount Due', value: `Rs.${totalUnpaid.toFixed(2)}`, color:'var(--warning)', bg:'var(--bg-card)', border:'var(--warning)' },
            { label:'Pending Reports', value: pendingReports.length, color:'var(--info)', bg:'var(--bg-card)', border:'var(--info)' },
            { label:'Reward Points', value: rewardPoints, sublabel: `Wallet: ₹${Number(walletBalance).toFixed(2)}`, color:'var(--accent)', bg:'var(--bg-card)', border:'var(--accent)' },
          ].map((c, i) => (
            <div key={i} style={{ background:'var(--bg-card)', borderRadius:'16px', padding:'20px', border:`1.5px solid ${c.border}`, boxShadow:'var(--shadow-card)', opacity: i === 0 ? 1 : 0.9 }}>
              <p style={{ fontSize:'11px', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.8px', margin:'0 0 8px' }}>{c.label}</p>
              <p style={{ fontSize:'24px', fontWeight:900, color:c.color, margin:0, letterSpacing:'-0.5px' }}>{c.value}</p>
              {c.sublabel && <p style={{ fontSize:'11px', color:c.color, margin:'6px 0 0', fontWeight:600 }}>{c.sublabel}</p>}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom:'32px', animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
          <h2 style={{ fontSize:'18px', fontWeight:800, color:'var(--text-primary)', marginBottom:'18px', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ width:'8px', height:'8px', background:'var(--primary)', borderRadius:'50%' }}></span>
            Quick Actions
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'12px' }}>
            {quickActions.map((a, i) => (
              <button key={i} onClick={() => navigate(a.path)} style={{
                display:'flex', alignItems:'center', gap:'14px', padding:'16px 20px',
                background:'var(--bg-card)', border:'1.5px solid var(--border)', borderRadius:'14px',
                cursor:'pointer', textAlign:'left', transition:'all 0.2s', width:'100%',
                boxShadow:'var(--shadow-card)'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='var(--shadow)'; e.currentTarget.style.borderColor='var(--primary)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='var(--shadow-card)'; e.currentTarget.style.borderColor='var(--border)' }}
              >
                <span style={{ fontSize:'24px' }}>{a.icon}</span>
                <div>
                  <p style={{ margin:0, fontSize:'14px', fontWeight:700, color:'var(--text-primary)' }}>{a.title}</p>
                  <p style={{ margin:0, fontSize:'11px', color:'var(--text-secondary)', marginTop:'2px' }}>{a.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ background:'var(--bg-card)', borderRadius:'20px', border:'1px solid var(--border)', boxShadow:'var(--shadow-card)', overflow:'hidden', marginBottom:'32px', animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
          <div style={{ padding:'24px', borderBottom:'1px solid var(--border)', background:'var(--bg-secondary)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <h2 style={{ fontSize:'18px', fontWeight:800, color:'var(--text-primary)', margin:0 }}>Traffic Statistics & Insights</h2>
              <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginTop:'4px' }}>Overview based on your reports</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ width:'8px', height:'8px', background:'var(--primary)', borderRadius:'50%', animation:'pulse 1.5s infinite' }}></span>
              <span style={{ fontSize:'13px', fontWeight:700, color:'var(--text-primary)' }}>Live Data</span>
            </div>
          </div>
          <div style={{ padding:'24px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px' }}>
              {[
                { label:'This Month\'s Reports', value: thisMonthReports.length, sub:'Reports submitted this month', color:'var(--primary)', bg:'var(--bg-primary)', border:'var(--primary)' },
                { label:'Top Violation', value: topViolation, sub:'Most reported type', color:'var(--accent)', bg:'var(--bg-primary)', border:'var(--accent)', small:true },
                { label:'Verified Rate', value: `${verifiedRate}%`, sub:`${reports.filter(r => r.status==='Verified'||r.status==='Challan Issued').length} verified`, color:'var(--success)', bg:'var(--bg-primary)', border:'var(--success)' },
                { label:'Active Areas', value: activeAreas, sub:'Locations reported from', color:'var(--warning)', bg:'var(--bg-primary)', border:'var(--warning)' },
              ].map((s, i) => (
                <div key={i} style={{ background:'var(--bg-primary)', borderRadius:'14px', padding:'20px', border:`1.5px solid var(--border)`, borderLeft:`4px solid ${s.color}` }}>
                  <p style={{ fontSize:'12px', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 10px' }}>{s.label}</p>
                  <p style={{ fontSize: s.small ? '16px' : '32px', fontWeight:900, color:'var(--text-primary)', margin:'0 0 6px', lineHeight:1 }}>{s.value}</p>
                  <p style={{ fontSize:'11px', color:'var(--text-muted)', margin:0 }}>{s.sub}</p>
                </div>
              ))}
            </div>
            <div style={{ borderColor: 'var(--border)' }} className="mt-6 pt-6 border-t  flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                {[
                  { dot:'#3b82f6', label:'Pending', count: reports.filter(r=>r.status==='Pending').length },
                  { dot:'#10b981', label:'Verified', count: reports.filter(r=>r.status==='Verified').length },
                  { dot:'#ef4444', label:'Rejected', count: reports.filter(r=>r.status==='Rejected').length },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:item.dot }}></div>
                    <span style={{ color: 'var(--text-secondary)' }} className="text-sm">{item.label}: <strong style={{ color: 'var(--text-primary)' }} className="">{item.count}</strong></span>
                  </div>
                ))}
              </div>
              <div style={{ color: 'var(--text-secondary)' }} className="text-sm">Last updated: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        {/* Challans Table */}
        <div style={{ background:'var(--bg-card)', borderRadius:'20px', border:'1px solid var(--border)', boxShadow:'var(--shadow-card)', overflow:'hidden', marginBottom:'32px', animation: 'fadeInUp 0.6s ease-out 0.4s both' }}>
          <div style={{ padding:'24px', borderBottom:'1px solid var(--border)', background:'var(--bg-secondary)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <h2 style={{ fontSize:'18px', fontWeight:800, color:'var(--text-primary)', margin:0 }}>Traffic Challans</h2>
              <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginTop:'4px' }}>Fines issued for traffic violations</p>
            </div>
            <span style={{ padding:'5px 14px', borderRadius:'99px', fontSize:'12px', fontWeight:700, background:'var(--danger-light)', color:'var(--danger)', border:'1px solid var(--danger)' }}>{unpaidChallans.length} unpaid</span>
          </div>
          {challans.length === 0 ? (
            <div style={{ padding:'64px', textAlign:'center' }}>
              <div style={{ width:'64px', height:'64px', background:'var(--bg-primary)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:'var(--success)', border:'1.5px solid var(--border)' }}>✓</div>
              <h3 style={{ fontSize:'18px', fontWeight:700, color:'var(--text-primary)', marginBottom:'8px' }}>No Challans</h3>
              <p style={{ fontSize:'14px', color:'var(--text-secondary)', margin:0 }}>You have no traffic violation challans. Great driving!</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead style={{ background:'var(--bg-primary)', borderBottom:'1px solid var(--border)' }}>
                  <tr>
                    {['Challan ID','Violation','Vehicle','Amount','Date','Status','Action'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'16px 24px', fontSize:'11px', fontWeight:800, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'1px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {challans.map(challan => (
                    <tr key={challan.challan_id} style={{ borderBottom:'1px solid var(--border)', transition:'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding:'20px 24px', fontSize:'14px', fontWeight:700, color:'var(--text-primary)' }}>#{challan.challan_id}</td>
                      <td style={{ padding:'20px 24px' }}>
                        <p style={{ margin:0, fontSize:'14px', fontWeight:700, color:'var(--text-primary)' }}>{challan.rule_name}</p>
                        <p style={{ margin:'2px 0 0', fontSize:'11px', color:'var(--text-muted)', fontFamily:'monospace' }}>{challan.rule_code}</p>
                      </td>
                      <td style={{ padding:'20px 24px', fontSize:'14px', fontFamily:'monospace', fontWeight:600, color:'var(--text-secondary)' }}>{challan.plate_no}</td>
                      <td style={{ padding:'20px 24px', fontSize:'14px', fontWeight:800, color:'var(--text-primary)' }}>Rs.{parseFloat(challan.total_amount).toFixed(2)}</td>
                      <td style={{ padding:'20px 24px', fontSize:'14px', color:'var(--text-secondary)' }}>{new Date(challan.issue_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                      <td style={{ padding:'20px 24px' }}>
                        <span style={{ padding:'4px 12px', borderRadius:'99px', fontSize:'11px', fontWeight:700, border:'1px solid transparent', ...{
                          'Unpaid': { background:'var(--danger-light)', color:'var(--danger)', borderColor:'var(--danger)' },
                          'Paid': { background:'var(--success-light)', color:'var(--success)', borderColor:'var(--success)' },
                          'Overdue': { background:'var(--warning-light)', color:'var(--warning)', borderColor:'var(--warning)' }
                        }[challan.payment_status] }}>{challan.payment_status}</span>
                      </td>
                      <td style={{ padding:'20px 24px' }}>
                        {challan.payment_status === 'Unpaid' ? (
                          <button onClick={() => handlePayChallan(challan.challan_id, challan.total_amount)}
                            style={{ padding:'8px 16px', background:'var(--success)', color:'#fff', borderRadius:'8px', border:'none', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
                            Pay Now
                          </button>
                        ) : (
                          <span style={{ color:'var(--success)', fontSize:'13px', fontWeight:700 }}>✓ Paid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reports Table */}
        <div style={{ background:'var(--bg-card)', borderRadius:'20px', border:'1px solid var(--border)', boxShadow:'var(--shadow-card)', overflow:'hidden' }}>
          <div style={{ padding:'24px', borderBottom:'1px solid var(--border)', background:'var(--bg-secondary)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <h2 style={{ fontSize:'18px', fontWeight:800, color:'var(--text-primary)', margin:0 }}>My Submissions</h2>
              <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginTop:'4px' }}>Track status of your traffic violation reports</p>
            </div>
            <span style={{ padding:'5px 14px', borderRadius:'99px', fontSize:'12px', fontWeight:700, background:'var(--info-light)', color:'var(--info)', border:'1px solid var(--info)' }}>{reports.length} total</span>
          </div>
          {reports.length === 0 ? (
            <div style={{ padding:'64px', textAlign:'center' }}>
              <div style={{ width:'64px', height:'64px', background:'var(--bg-primary)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:'var(--text-muted)', border:'1.5px solid var(--border)' }}>?</div>
              <h3 style={{ fontSize:'18px', fontWeight:700, color:'var(--text-primary)', marginBottom:'8px' }}>No Reports Submitted</h3>
              <p style={{ fontSize:'14px', color:'var(--text-secondary)', margin:0 }}>You haven't submitted any traffic violation reports yet.</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead style={{ background:'var(--bg-primary)', borderBottom:'1px solid var(--border)' }}>
                  <tr>
                    {['Report ID','Vehicle','Violation','Location','Date','Status','Action'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'16px 24px', fontSize:'11px', fontWeight:800, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'1px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.report_id} style={{ borderBottom:'1px solid var(--border)', transition:'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding:'20px 24px', fontSize:'14px', fontWeight:700, color:'var(--text-primary)' }}>#{report.report_id}</td>
                      <td style={{ padding:'20px 24px', fontSize:'14px', fontFamily:'monospace', fontWeight:600, color:'var(--text-secondary)' }}>{report.plate_no}</td>
                      <td style={{ padding:'20px 24px' }}>
                        <span style={{ padding:'4px 10px', borderRadius:'99px', fontSize:'11px', fontWeight:700, background:'var(--bg-secondary)', color:'var(--primary)', border:'1px solid var(--border)' }}>{report.violation_type}</span>
                      </td>
                      <td style={{ padding:'20px 24px', fontSize:'13px', color:'var(--text-secondary)', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{report.location_address || 'N/A'}</td>
                      <td style={{ padding:'20px 24px', fontSize:'14px', color:'var(--text-secondary)' }}>{new Date(report.reported_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                      <td style={{ padding:'20px 24px' }}>
                        <span style={{ padding:'4px 12px', borderRadius:'99px', fontSize:'11px', fontWeight:700, border:'1px solid transparent', ...{
                          'Pending': { background:'var(--warning-light)', color:'var(--warning)', borderColor:'var(--warning)' },
                          'Verified': { background:'var(--success-light)', color:'var(--success)', borderColor:'var(--success)' },
                          'Rejected': { background:'var(--danger-light)', color:'var(--danger)', borderColor:'var(--danger)' },
                          'Challan Issued': { background:'var(--accent-light)', color:'var(--accent)', borderColor:'var(--accent)' }
                        }[report.status] }}>{report.status}</span>
                      </td>
                      <td style={{ padding:'20px 24px' }}>
                        {report.status === 'Pending' ? (
                          <button onClick={() => handleDeleteReport(report.report_id)}
                            style={{ padding:'6px 12px', background:'var(--danger-light)', color:'var(--danger)', borderRadius:'8px', border:'1px solid var(--danger)', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
                            Delete
                          </button>
                        ) : (
                          <span style={{ color:'var(--text-muted)', fontSize:'12px' }}>Locked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default CitizenDashboard
