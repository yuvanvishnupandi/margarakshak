import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

import { API_BASE_URL } from '../config';
const API = API_BASE_URL;
// Replaced by automated script

const getEvidencePaths = (ep) => {
  if (!ep) return []
  try { const p = JSON.parse(ep); return Array.isArray(p) ? p : [ep] } catch { return ep.includes(',') ? ep.split(',').map(s => s.trim()) : [ep] }
}

function PhotoModal({ paths, onClose }) {
  const [cur, setCur] = useState(0)
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') setCur(c => Math.min(c+1,paths.length-1)); if (e.key === 'ArrowLeft') setCur(c => Math.max(c-1,0)) }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [paths.length, onClose])
  if (!paths.length) return null
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'32px' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background: 'var(--bg-card)',borderRadius:'16px',boxShadow:'0 24px 64px rgba(0,0,0,0.15)',maxWidth:'820px',width:'100%',overflow:'hidden' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 24px',borderBottom:'1px solid #e2e8f0' }}>
          <div>
            <p style={{ margin:0,fontSize:'15px',fontWeight:700,color: 'var(--text-primary)' }}>Evidence Photos</p>
            <p style={{ margin:0,fontSize:'12px',color:'#94a3b8' }}>{cur+1} of {paths.length}</p>
          </div>
          <button onClick={onClose} style={{ background:'#f1f5f9',border:'none',borderRadius:'8px',padding:'8px 18px',fontSize:'13px',fontWeight:600,color:'#475569',cursor:'pointer' }}>Close</button>
        </div>
        <div style={{ position:'relative',background: 'var(--bg-primary)',display:'flex',alignItems:'center',justifyContent:'center',minHeight:'420px' }}>
          <img src={`${API_BASE_URL}${paths[cur]}`} alt={`Evidence ${cur+1}`} style={{ maxWidth:'100%',maxHeight:'500px',objectFit:'contain',display:'block' }} />
          {cur > 0 && <button onClick={()=>setCur(c=>c-1)} style={{ position:'absolute',left:'16px',top:'50%',transform:'translateY(-50%)',background: 'var(--bg-card)',border:'1px solid #e2e8f0',borderRadius:'50%',width:'40px',height:'40px',fontSize:'22px',color:'#334155',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.1)',display:'flex',alignItems:'center',justifyContent:'center' }}>&#8249;</button>}
          {cur < paths.length-1 && <button onClick={()=>setCur(c=>c+1)} style={{ position:'absolute',right:'16px',top:'50%',transform:'translateY(-50%)',background: 'var(--bg-card)',border:'1px solid #e2e8f0',borderRadius:'50%',width:'40px',height:'40px',fontSize:'22px',color:'#334155',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.1)',display:'flex',alignItems:'center',justifyContent:'center' }}>&#8250;</button>}
        </div>
        {paths.length > 1 && (
          <div style={{ display:'flex',gap:'8px',padding:'12px 24px',background: 'var(--bg-primary)',borderTop:'1px solid #e2e8f0',overflowX:'auto' }}>
            {paths.map((p,i) => <img key={i} src={`${API_BASE_URL}${p}`} alt={`thumb ${i+1}`} onClick={()=>setCur(i)} style={{ width:'60px',height:'52px',objectFit:'cover',borderRadius:'6px',flexShrink:0,cursor:'pointer',border:i===cur?'2px solid #4f46e5':'2px solid #e2e8f0',opacity:i===cur?1:0.55,transition:'all 0.15s' }} />)}
          </div>
        )}
        <div style={{ padding:'12px 24px',display:'flex',justifyContent:'flex-end',borderTop:'1px solid #f1f5f9' }}>
          <button onClick={()=>window.open(`${API_BASE_URL}${paths[cur]}`,'_blank')} style={{ background:'none',border:'1px solid #cbd5e1',borderRadius:'8px',padding:'6px 16px',color:'#475569',fontSize:'12px',cursor:'pointer',fontWeight:600 }}>Open original</button>
        </div>
      </div>
    </div>
  )
}

function EvidenceCell({ ep, onOpen }) {
  const paths = getEvidencePaths(ep)
  if (!paths.length) return <span style={{ fontSize:'12px',color:'#94a3b8',fontStyle:'italic' }}>No photo</span>
  return (
    <button onClick={()=>onOpen(paths)} style={{ display:'flex',alignItems:'center',gap:'10px',background:'none',border:'1px solid #e2e8f0',borderRadius:'10px',padding:'7px 11px',cursor:'pointer',transition:'all 0.15s' }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='#4f46e5';e.currentTarget.style.background='#f5f3ff'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.background='none'}}>
      <div style={{ position:'relative',flexShrink:0 }}>
        <img src={`${API_BASE_URL}${paths[0]}`} alt="Evidence" style={{ width:'44px',height:'44px',objectFit:'cover',borderRadius:'6px',display:'block' }} />
        {paths.length > 1 && <span style={{ position:'absolute',top:'-5px',right:'-5px',background:'#4f46e5',color:'#fff',fontSize:'9px',fontWeight:800,minWidth:'17px',height:'17px',borderRadius:'999px',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #fff',padding:'0 3px' }}>{paths.length}</span>}
      </div>
      <div style={{ textAlign:'left' }}>
        <p style={{ margin:0,fontSize:'11px',fontWeight:700,color:'#4f46e5' }}>{paths.length===1?'View photo':`View all ${paths.length} photos`}</p>
        <p style={{ margin:0,fontSize:'10px',color:'#94a3b8' }}>Click to open</p>
      </div>
    </button>
  )
}

function ReviewReports() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  useEffect(() => { fetchReports(); const iv = setInterval(fetchReports, 3000); return () => clearInterval(iv) }, [])

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/police/pending`)
      if (!res.ok) throw new Error(res.status)
      const data = await res.json()
      setReports(data.reports || [])
    } catch (err) { showError('Failed to load reports') } finally { setLoading(false) }
  }

  const handleVerify = (id) => navigate(`/police/create-challan/${id}`)

  const handleReject = async (id) => {
    if (!confirm('Reject this report?')) return
    try {
      const user = JSON.parse(localStorage.getItem('user')) || {};
      const actualBadge = user.badge_no || 'POL0001';
      
      const res = await fetch(`${API_BASE_URL}/api/reports/police/process/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:'Rejected',badge_no: actualBadge}) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || d.error || 'Server error') }
      success('Report rejected'); fetchReports()
    } catch (err) { showError(err.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this record?')) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/${id}`, { method:'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || d.detail || 'Failed to delete') }
      success('Record deleted'); fetchReports()
    } catch (err) { showError(err.message) }
  }

  if (loading && reports.length === 0) return (
    <div style={{ minHeight:'100vh',background:'var(--bg-primary)',display:'flex',alignItems:'center',justifyContent:'center',paddingTop:'80px' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:'44px',height:'44px',border:'3px solid #e2e8f0',borderTopColor:'#4f46e5',borderRadius:'50%',animation:'spin 0.75s linear infinite',margin:'0 auto 12px' }} />
        <p style={{ color:'#94a3b8',fontSize:'14px',margin:0 }}>Loading reports...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh',background:'var(--bg-primary)',padding:'104px 32px 56px' }}>
      {modal && <PhotoModal paths={modal} onClose={()=>setModal(null)} />}
      <div style={{ marginBottom:'28px' }}>
        <h1 style={{ fontSize:'30px', fontWeight:800, color:'var(--text-primary)', margin:'0 0 4px', letterSpacing:'-0.5px' }}>Review Reports</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'14px', margin:0 }}>Pending traffic violation reports requiring review</p>
      </div>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'16px', background:'var(--bg-card)', borderRadius:'12px', border:'1px solid var(--border)', padding:'14px 24px', boxShadow:'var(--shadow-card)' }}>
          <div>
            <p style={{ margin:0, fontSize:'11px', color:'var(--text-secondary)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Pending Review</p>
            <p style={{ margin:0, fontSize:'26px', fontWeight:900, color:'var(--warning)', lineHeight:1 }}>{reports.length}</p>
          </div>
          <div style={{ width:'1px', height:'36px', background:'var(--border)' }} />
          <p style={{ margin:0, fontSize:'12px', color:'var(--text-muted)' }}>Verification Queue</p>
        </div>
      </div>
      <div style={{ background:'var(--bg-card)', borderRadius:'16px', border:'1px solid var(--border)', boxShadow:'var(--shadow-card)', overflow:'hidden' }}>
        {reports.length === 0 ? (
          <div style={{ padding:'72px 24px',textAlign:'center' }}>
            <div style={{ width:'52px',height:'52px',background:'#f0fdf4',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
              <svg width="22" height="22" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h3 style={{ fontSize:'17px',fontWeight:700,color: 'var(--text-primary)',margin:'0 0 6px' }}>All Caught Up</h3>
            <p style={{ color:'#64748b',fontSize:'14px',margin:0 }}>No pending reports to review.</p>
          </div>
        ) : (
          <table style={{ width:'100%',borderCollapse:'collapse',tableLayout:'fixed' }}>
            <colgroup>
              <col style={{ width:'64px' }} /><col style={{ width:'175px' }} /><col style={{ width:'110px' }} /><col style={{ width:'148px' }} />
              <col style={{ width:'160px' }} /><col style={{ width:'165px' }} /><col /><col style={{ width:'88px' }} /><col style={{ width:'215px' }} />
            </colgroup>
            <thead>
              <tr style={{ background:'var(--bg-primary)', borderBottom:'1.5px solid var(--border)' }}>
                {['ID','Reporter','Plate No.','Violation','Evidence','Location','Description','Date','Actions'].map(h => (
                  <th key={h} style={{ padding:'13px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'var(--text-secondary)', letterSpacing:'0.7px', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.report_id} style={{ borderBottom:'1px solid var(--border)', background:'var(--bg-card)', transition:'background 0.1s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-primary)'}
                  onMouseLeave={e=>e.currentTarget.style.background='var(--bg-card)'}>
                  <td style={{ padding:'16px 16px', fontSize:'13px', fontWeight:800, color:'var(--accent)' }}>#{r.report_id}</td>
                  <td style={{ padding:'16px 16px' }}>
                    <p style={{ margin:0, fontSize:'13px', fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.reporter_name}</p>
                    <p style={{ margin:0, fontSize:'11px', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.reporter_email}</p>
                  </td>
                  <td style={{ padding:'16px 16px', fontSize:'12px', fontWeight:700, fontFamily:'monospace', color:'var(--text-primary)' }}>{r.plate_no}</td>
                  <td style={{ padding:'16px 16px' }}>
                    <span style={{ display:'inline-block',padding:'4px 10px',background:'#eff6ff',color:'#1d4ed8',borderRadius:'6px',fontSize:'11px',fontWeight:700,maxWidth:'135px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{r.violation_type}</span>
                  </td>
                  <td style={{ padding:'16px 16px' }}><EvidenceCell ep={r.evidence_path} onOpen={(paths)=>setModal(paths)} /></td>
                  <td style={{ padding:'16px 16px', fontSize:'12px', color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.location_address||'—'}</td>
                  <td style={{ padding:'16px 16px', fontSize:'12px', color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.description||'No additional description'}</td>
                  <td style={{ padding:'16px 16px', fontSize:'11px', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{new Date(r.reported_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'})}</td>
                  <td style={{ padding:'16px 16px' }}>
                    <div style={{ display:'flex',gap:'6px',alignItems:'center' }}>
                      <button onClick={()=>handleVerify(r.report_id)} style={{ padding:'7px 14px',background:'#16a34a',color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:700,cursor:'pointer' }}
                        onMouseEnter={e=>e.currentTarget.style.background='#15803d'} onMouseLeave={e=>e.currentTarget.style.background='#16a34a'}>Verify</button>
                      <button onClick={()=>handleReject(r.report_id)} style={{ padding:'7px 14px',background:'#dc2626',color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:700,cursor:'pointer' }}
                        onMouseEnter={e=>e.currentTarget.style.background='#b91c1c'} onMouseLeave={e=>e.currentTarget.style.background='#dc2626'}>Reject</button>
                      <button onClick={()=>handleDelete(r.report_id)} style={{ padding:'7px 10px',background: 'var(--bg-card)',color:'#64748b',border:'1px solid #e2e8f0',borderRadius:'8px',fontSize:'12px',fontWeight:600,cursor:'pointer' }}
                        onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.color='#dc2626';e.currentTarget.style.borderColor='#fca5a5'}}
                        onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.color='#64748b';e.currentTarget.style.borderColor='#e2e8f0'}}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default ReviewReports
