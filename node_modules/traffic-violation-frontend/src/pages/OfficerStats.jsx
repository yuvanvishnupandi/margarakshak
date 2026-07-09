import { useState, useEffect } from 'react'

import { API_BASE_URL } from '../config';
const API = API_BASE_URL;

export default function OfficerStats() {
  const [officers, setOfficers] = useState([])
  const [loading, setLoading] = useState(true)
  const [flagging, setFlagging] = useState(false)
  const [overdueResult, setOverdueResult] = useState(null)
  const [sessions, setSessions] = useState([])
  const [activeTab, setActiveTab] = useState('officers')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [offRes, sesRes] = await Promise.allSettled([
        fetch(`${API}/api/admin/officer-stats`),
        fetch(`${API}/api/admin/active-sessions`)
      ])
      if (offRes.status === 'fulfilled' && offRes.value.ok) {
        const d = await offRes.value.json()
        setOfficers(d.officers || [])
      }
      if (sesRes.status === 'fulfilled' && sesRes.value.ok) {
        const d = await sesRes.value.json()
        setSessions(d.sessions || [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const flagOverdue = async () => {
    setFlagging(true)
    try {
      const res = await fetch(`${API}/api/admin/flag-overdue`, { method: 'POST' })
      const d = await res.json()
      setOverdueResult(d)
    } catch (e) { console.error(e) }
    finally { setFlagging(false) }
  }

  const tabs = [
    { id:'officers', label:'Officer Performance' },
    { id:'sessions', label:`Active Sessions (${sessions.length})` },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', paddingTop:'120px', paddingBottom:'40px' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 24px' }}>

        <div style={{ marginBottom:'28px', display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'16px' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
              <div style={{ width:'4px', height:'20px', background:'#8b5cf6', borderRadius:'2px' }}/>
              <span style={{ fontSize:'11px', fontWeight:700, color:'#8b5cf6', letterSpacing:'1.2px', textTransform:'uppercase' }}>Police Admin</span>
            </div>
            <h1 style={{ fontSize:'28px', fontWeight:800, color:'var(--text-primary)', margin:0 }}>Officer Performance & Sessions</h1>
            <p style={{ color:'var(--text-secondary)', fontSize:'14px', margin:'6px 0 0' }}>Powered by Officer_Performance_View & ACTIVE_SESSIONS</p>
          </div>
          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
            <button onClick={fetchAll} style={{ padding:'9px 18px', background:'#f1f5f9', color:'#475569', border:'1.5px solid #e2e8f0', borderRadius:'8px', fontWeight:600, fontSize:'13px', cursor:'pointer' }}>↺ Refresh</button>
            <button onClick={flagOverdue} disabled={flagging} style={{
              padding:'9px 18px', background: flagging ? '#c4b5fd' : '#8b5cf6', color:'#fff',
              border:'none', borderRadius:'8px', fontWeight:700, fontSize:'13px', cursor: flagging ? 'not-allowed':'pointer'
            }}>{flagging ? 'Running…' : '⚡ Flag Overdue Challans'}</button>
          </div>
        </div>

        {overdueResult && (
          <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:'12px', padding:'14px 20px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'12px' }}>
            <span style={{ fontSize:'20px' }}>✅</span>
            <span style={{ fontSize:'14px', fontWeight:600, color:'#15803d' }}>Overdue check complete — {overdueResult.flagged_count} challans flagged with 15% late penalty.</span>
            <button onClick={() => setOverdueResult(null)} style={{ marginLeft:'auto', background:'none', border:'none', color:'#15803d', cursor:'pointer', fontSize:'18px' }}>×</button>
          </div>
        )}

        {}
        <div style={{ display:'flex', gap:'4px', marginBottom:'20px', background:'#f1f5f9', borderRadius:'10px', padding:'4px', width:'fit-content' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding:'8px 20px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:700, transition:'all 0.2s',
              background: activeTab === t.id ? '#fff' : 'transparent',
              color: activeTab === t.id ? '#0f172a' : '#64748b',
              boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
            }}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'60px', color:'#94a3b8' }}>Loading…</div>
        ) : activeTab === 'officers' ? (
          <div style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #e2e8f0', overflow:'hidden' }}>
            {officers.length === 0 ? (
              <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>No officer data available.</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f8fafc', borderBottom:'1.5px solid #e2e8f0' }}>
                    {['Badge No','Officer','Station','Verified','Rejected','Challans Issued','Revenue Collected'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {officers.map((o, i) => (
                    <tr key={o.badge_no} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', fontWeight:700, color:'#3b82f6' }}>{o.badge_no}</td>
                      <td style={{ padding:'14px 16px', fontSize:'14px', fontWeight:600, color:'#0f172a' }}>{o.full_name}</td>
                      <td style={{ padding:'14px 16px', fontSize:'13px', color:'#475569' }}>{o.station_code}</td>
                      <td style={{ padding:'14px 16px' }}><span style={{ background:'#f0fdf4', color:'#15803d', border:'1px solid #bbf7d0', padding:'3px 10px', borderRadius:'999px', fontSize:'12px', fontWeight:700 }}>{o.verified_count}</span></td>
                      <td style={{ padding:'14px 16px' }}><span style={{ background:'#fef2f2', color:'#b91c1c', border:'1px solid #fecaca', padding:'3px 10px', borderRadius:'999px', fontSize:'12px', fontWeight:700 }}>{o.rejected_count}</span></td>
                      <td style={{ padding:'14px 16px', fontSize:'14px', fontWeight:700, color:'#0f172a' }}>{o.challans_issued}</td>
                      <td style={{ padding:'14px 16px', fontSize:'14px', fontWeight:700, color:'#8b5cf6' }}>₹{Number(o.revenue_collected).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #e2e8f0', overflow:'hidden' }}>
            {sessions.length === 0 ? (
              <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>No active sessions right now.</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f8fafc', borderBottom:'1.5px solid #e2e8f0' }}>
                    {['User ID','Role','IP Address','Created At','Expires At'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => (
                    <tr key={s.session_id} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', color:'#0f172a' }}>{s.user_id}</td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ background: s.user_role==='Police' ? '#eff6ff' : '#f0fdf4', color: s.user_role==='Police' ? '#1d4ed8' : '#15803d', border:`1px solid ${s.user_role==='Police' ? '#bfdbfe' : '#bbf7d0'}`, padding:'3px 10px', borderRadius:'999px', fontSize:'12px', fontWeight:700 }}>{s.user_role}</span>
                      </td>
                      <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'12px', color:'#64748b' }}>{s.ip_address || 'N/A'}</td>
                      <td style={{ padding:'14px 16px', fontSize:'12px', color:'#475569' }}>{new Date(s.created_at).toLocaleString('en-IN')}</td>
                      <td style={{ padding:'14px 16px', fontSize:'12px', color:'#475569' }}>{new Date(s.expires_at).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
