import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ textAlign:'center', maxWidth:'420px' }}>
        <div style={{ fontSize:'96px', fontWeight:900, color:'#e2e8f0', lineHeight:1, marginBottom:'8px' }}>404</div>
        <h1 style={{ fontSize:'24px', fontWeight:800, color:'var(--text-primary)', margin:'0 0 12px' }}>Page Not Found</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'15px', margin:'0 0 28px', lineHeight:1.6 }}>The page you're looking for doesn't exist or has been moved.</p>
        <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => navigate(-1)} style={{ padding:'10px 24px', background:'#f1f5f9', color:'#475569', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontWeight:700, fontSize:'14px', cursor:'pointer' }}>← Go Back</button>
          <button onClick={() => navigate('/hero')} style={{ padding:'10px 24px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:'10px', fontWeight:700, fontSize:'14px', cursor:'pointer' }}>🏠 Home</button>
        </div>
      </div>
    </div>
  )
}
