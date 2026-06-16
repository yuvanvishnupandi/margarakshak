import { useState, useEffect } from 'react'

import { API_BASE_URL } from '../config';
const API = API_BASE_URL;

export default function PaymentHistory() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [user, setUser]         = useState(null)
  const [totalPaid, setTotalPaid] = useState(0)

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(u)
    if (u?.id) fetchPayments(u.id)
    else setLoading(false)
  }, [])

  const fetchPayments = async (id) => {
    try {
      
      const res = await fetch(`${API}/api/challans/citizen/${id}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const paid = (data.challans || []).filter(c => c.payment_status === 'Paid')
      setPayments(paid)
      setTotalPaid(paid.reduce((s, c) => s + Number(c.total_amount || 0), 0))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : 'N/A'
  const fmtCur  = (n) => `₹${Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:2 })}`

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', paddingTop:'120px', paddingBottom:'40px' }}>
      <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'0 24px' }}>

        {}
        <div style={{ marginBottom:'28px', display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'16px' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
              <div style={{ width:'4px', height:'20px', background:'#10b981', borderRadius:'2px' }}/>
              <span style={{ fontSize:'11px', fontWeight:700, color:'#10b981', letterSpacing:'1.2px', textTransform:'uppercase' }}>Payment Records</span>
            </div>
            <h1 style={{ fontSize:'28px', fontWeight:800, color:'var(--text-primary)', margin:0 }}>Payment History</h1>
            <p style={{ color:'var(--text-secondary)', fontSize:'14px', margin:'6px 0 0' }}>All challan payments made by your account</p>
          </div>
          <button onClick={() => user?.id && fetchPayments(user.id)} style={{ padding:'9px 18px', background:'#f1f5f9', color:'#475569', border:'1.5px solid #e2e8f0', borderRadius:'8px', fontWeight:600, fontSize:'13px', cursor:'pointer' }}>↺ Refresh</button>
        </div>

        {}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'24px' }}>
          {[
            { label:'Total Payments', value: payments.length, color:'#10b981', bg:'#f0fdf4', border:'#bbf7d0' },
            { label:'Total Amount Paid', value: fmtCur(totalPaid), color:'#3b82f6', bg:'#eff6ff', border:'#bfdbfe' },
            { label:'Reward Points Earned', value: `+${payments.length * 2} pts`, color:'#8b5cf6', bg:'#f5f3ff', border:'#ddd6fe' },
          ].map(c => (
            <div key={c.label} style={{ background:'#fff', border:`1.5px solid ${c.border}`, borderRadius:'12px', padding:'18px 20px' }}>
              <p style={{ margin:'0 0 4px', fontSize:'11px', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px' }}>{c.label}</p>
              <p style={{ margin:0, fontSize:'26px', fontWeight:800, color:c.color }}>{c.value}</p>
            </div>
          ))}
        </div>

        {}
        <div style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #e2e8f0', overflow:'hidden' }}>
          {loading ? (
            <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>Loading payment history…</div>
          ) : payments.length === 0 ? (
            <div style={{ padding:'60px', textAlign:'center' }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>💳</div>
              <h3 style={{ fontSize:'16px', fontWeight:700, color:'#0f172a', margin:'0 0 8px' }}>No Payments Yet</h3>
              <p style={{ color:'#64748b', fontSize:'14px', margin:0 }}>You haven't paid any challans. All paid challan records will appear here.</p>
            </div>
          ) : (
            <>
              <div style={{ padding:'16px 20px', background:'#f8fafc', borderBottom:'1.5px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h2 style={{ margin:0, fontSize:'15px', fontWeight:700, color:'#0f172a' }}>Payment Records ({payments.length})</h2>
                <span style={{ fontSize:'12px', color:'#64748b' }}>+2 reward points per payment</span>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f8fafc', borderBottom:'1.5px solid #e2e8f0' }}>
                    {['Challan #','Violation','Vehicle','Amount Paid','Paid On','Transaction Ref'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={p.challan_id} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding:'14px 16px', fontWeight:700, color:'#10b981', fontSize:'13px' }}>#{p.challan_id}</td>
                      <td style={{ padding:'14px 16px' }}>
                        <p style={{ margin:0, fontSize:'13px', fontWeight:600, color:'#0f172a' }}>{p.rule_name || 'N/A'}</p>
                        <p style={{ margin:0, fontSize:'11px', fontFamily:'monospace', color:'#64748b' }}>{p.rule_code}</p>
                      </td>
                      <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', fontWeight:600, color:'#475569' }}>{p.plate_no || 'N/A'}</td>
                      <td style={{ padding:'14px 16px', fontSize:'15px', fontWeight:800, color:'#10b981' }}>{fmtCur(p.total_amount)}</td>
                      <td style={{ padding:'14px 16px', fontSize:'13px', color:'#475569' }}>{fmtDate(p.paid_at || p.issue_date)}</td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ fontFamily:'monospace', fontSize:'11px', background:'#f0fdf4', color:'#15803d', border:'1px solid #bbf7d0', padding:'3px 8px', borderRadius:'6px', letterSpacing:'0.5px' }}>{p.transaction_ref || 'N/A'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background:'#f8fafc', borderTop:'2px solid #e2e8f0' }}>
                    <td colSpan={3} style={{ padding:'14px 16px', fontSize:'14px', fontWeight:700, color:'#0f172a' }}>Total</td>
                    <td style={{ padding:'14px 16px', fontSize:'16px', fontWeight:800, color:'#10b981' }}>{fmtCur(totalPaid)}</td>
                    <td colSpan={2}/>
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
