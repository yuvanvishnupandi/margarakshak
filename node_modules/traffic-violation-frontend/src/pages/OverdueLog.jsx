import { useState, useEffect } from 'react'

const API = 'https://margarakshak-backend.onrender.com'

export default function OverdueLog() {
  const [log, setLog] = useState([])
  const [habitual, setHabitual] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overdue')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [overdueRes, habitualRes] = await Promise.allSettled([
        fetch(`${API}/api/admin/overdue-log`),
        fetch(`${API}/api/admin/habitual-offenders`)
      ])
      if (overdueRes.status === 'fulfilled' && overdueRes.value.ok) {
        const d = await overdueRes.value.json()
        setLog(d.overdue_log || [])
      }
      if (habitualRes.status === 'fulfilled' && habitualRes.value.ok) {
        const d = await habitualRes.value.json()
        setHabitual(d.habitual_offenders || [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const tabs = [
    { id:'overdue', label:`Overdue Log (${log.length})` },
    { id:'habitual', label:`Habitual Offenders (${habitual.length})` },
  ]

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : 'N/A'
  const fmtCur  = (n) => `₹${Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:2 })}`

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', paddingTop:'120px', paddingBottom:'40px' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 24px' }}>

        <div style={{ marginBottom:'28px', display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'16px' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
              <div style={{ width:'4px', height:'20px', background:'#ef4444', borderRadius:'2px' }}/>
              <span style={{ fontSize:'11px', fontWeight:700, color:'#ef4444', letterSpacing:'1.2px', textTransform:'uppercase' }}>Police Admin</span>
            </div>
            <h1 style={{ fontSize:'28px', fontWeight:800, color:'var(--text-primary)', margin:0 }}>Overdue Log & Habitual Offenders</h1>
            <p style={{ color:'var(--text-secondary)', fontSize:'14px', margin:'6px 0 0' }}>From OVERDUE_LOG table & Habitual_Offenders_View</p>
          </div>
          <button onClick={fetchAll} style={{ padding:'9px 18px', background:'#f1f5f9', color:'#475569', border:'1.5px solid #e2e8f0', borderRadius:'8px', fontWeight:600, fontSize:'13px', cursor:'pointer' }}>↺ Refresh</button>
        </div>

        {/* Summary Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'24px' }}>
          {[
            { label:'Total Overdue', value: log.length, color:'#ef4444', bg:'#fef2f2', border:'#fecaca' },
            { label:'Total Penalty', value: fmtCur(log.reduce((s,l) => s + Number(l.penalty_amount||0), 0)), color:'#b45309', bg:'#fffbeb', border:'#fde68a' },
            { label:'Habitual Offenders', value: habitual.length, color:'#8b5cf6', bg:'#f5f3ff', border:'#ddd6fe' },
          ].map(c => (
            <div key={c.label} style={{ background:'#fff', border:`1.5px solid ${c.border}`, borderRadius:'12px', padding:'18px 20px' }}>
              <p style={{ margin:'0 0 4px', fontSize:'11px', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px' }}>{c.label}</p>
              <p style={{ margin:0, fontSize:'26px', fontWeight:800, color:c.color }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
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
        ) : activeTab === 'overdue' ? (
          <div style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #e2e8f0', overflow:'hidden' }}>
            {log.length === 0 ? (
              <div style={{ padding:'60px', textAlign:'center' }}>
                <div style={{ fontSize:'40px', marginBottom:'12px' }}>✅</div>
                <p style={{ fontSize:'16px', fontWeight:600, color:'#15803d', margin:0 }}>No overdue challans! All payments are current.</p>
              </div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#fef2f2', borderBottom:'1.5px solid #fecaca' }}>
                    {['Challan #','Citizen','Phone','Original Amount','15% Penalty','Flagged On','Current Status'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#b91c1c', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {log.map((l, i) => (
                    <tr key={l.log_id} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0 ? '#fff' : '#fff9f9' }}>
                      <td style={{ padding:'14px 16px', fontWeight:700, color:'#ef4444', fontSize:'13px' }}>#{l.challan_id}</td>
                      <td style={{ padding:'14px 16px' }}>
                        <p style={{ margin:0, fontSize:'14px', fontWeight:600, color:'#0f172a' }}>{l.citizen_name}</p>
                        <p style={{ margin:0, fontSize:'12px', color:'#64748b' }}>{l.citizen_email}</p>
                      </td>
                      <td style={{ padding:'14px 16px', fontSize:'13px', color:'#475569', fontFamily:'monospace' }}>{l.phone_no || 'N/A'}</td>
                      <td style={{ padding:'14px 16px', fontSize:'14px', fontWeight:600, color:'#0f172a' }}>{fmtCur(l.original_amount)}</td>
                      <td style={{ padding:'14px 16px' }}><span style={{ background:'#fef2f2', color:'#ef4444', border:'1px solid #fecaca', padding:'3px 10px', borderRadius:'999px', fontSize:'12px', fontWeight:700 }}>+{fmtCur(l.penalty_amount)}</span></td>
                      <td style={{ padding:'14px 16px', fontSize:'12px', color:'#64748b' }}>{fmtDate(l.flagged_at)}</td>
                      <td style={{ padding:'14px 16px' }}><span style={{ background:'#fef9c3', color:'#92400e', border:'1px solid #fde68a', padding:'3px 10px', borderRadius:'999px', fontSize:'12px', fontWeight:700 }}>{l.payment_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #e2e8f0', overflow:'hidden' }}>
            {habitual.length === 0 ? (
              <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>No habitual offenders (vehicles with 2+ violations).</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f5f3ff', borderBottom:'1.5px solid #ddd6fe' }}>
                    {['Plate No','Model','Type','Owner','Violations','Total Fines','Unpaid Amount'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {habitual.map((h, i) => (
                    <tr key={h.plate_no} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0 ? '#fff' : '#fdfcff' }}>
                      <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', fontWeight:800, color:'#7c3aed' }}>{h.plate_no}</td>
                      <td style={{ padding:'14px 16px', fontSize:'13px', color:'#0f172a' }}>{h.vehicle_model || 'Unknown'}</td>
                      <td style={{ padding:'14px 16px', fontSize:'12px', color:'#64748b' }}>{h.vehicle_type}</td>
                      <td style={{ padding:'14px 16px', fontSize:'13px', color:'#475569' }}>{h.owner_name || 'N/A'}</td>
                      <td style={{ padding:'14px 16px' }}><span style={{ background:'#fef2f2', color:'#ef4444', border:'1px solid #fecaca', padding:'3px 12px', borderRadius:'999px', fontSize:'13px', fontWeight:800 }}>{h.violation_count}</span></td>
                      <td style={{ padding:'14px 16px', fontSize:'14px', fontWeight:700, color:'#0f172a' }}>{fmtCur(h.total_fines)}</td>
                      <td style={{ padding:'14px 16px', fontSize:'14px', fontWeight:700, color:'#ef4444' }}>{fmtCur(h.unpaid_amount)}</td>
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
