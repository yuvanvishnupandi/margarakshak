import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import { API_BASE_URL } from '../config';
const API = API_BASE_URL;
// Replaced by automated script

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16']

const StatCard = ({ label, value, sub, color='#1d4ed8', bg='var(--primary-bg)', border='#bfdbfe', icon }) => (
  <div style={{ background:'var(--bg-card)', border:`1.5px solid ${border}`, borderRadius:'16px', padding:'22px 24px', display:'flex', alignItems:'center', gap:'16px' }}>
    <div style={{ width:'48px', height:'48px', background:bg, borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0, fontSize:'22px' }}>{icon}</div>
    <div>
      <p style={{ margin:'0 0 2px', fontSize:'11px', color:'var(--text-secondary)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</p>
      <p style={{ margin:0, fontSize:'26px', fontWeight:900, color, lineHeight:1 }}>{value}</p>
      {sub && <p style={{ margin:'3px 0 0', fontSize:'11px', color:'var(--text-secondary)' }}>{sub}</p>}
    </div>
  </div>
)

function Analytics() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isCitizen = user?.role === 'citizen'
  const [data, setData] = useState(null)
  const [violations, setViolations] = useState([])
  const [heatmap, setHeatmap] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [trendMonths, setTrendMonths] = useState(6)
  const intervalRef = useRef(null)

  const fetchAll = async (months) => {
    const m = months || trendMonths
    try {
      const [mainRes, violRes, heatRes] = await Promise.allSettled([
        fetch(isCitizen
          ? `${API}/api/analytics/citizen/${user.id}?months=${m}`
          : `${API}/api/analytics/police/system?months=${m}`),
        fetch(`${API}/api/analytics/violation-types`),
        fetch(`${API}/api/analytics/heatmap-data`),
      ])
      if (mainRes.status === 'fulfilled' && mainRes.value.ok) {
        const j = await mainRes.value.json()
        setData(j.data)
      }
      if (violRes.status === 'fulfilled' && violRes.value.ok) {
        const j = await violRes.value.json()
        setViolations(j.data || [])
      }
      if (heatRes.status === 'fulfilled' && heatRes.value.ok) {
        const j = await heatRes.value.json()
        setHeatmap(j.data || [])
      }
      setLastUpdate(new Date())
    } catch (e) { console.warn('Analytics fetch:', e) }
    finally { setLoading(false) }
  }

  const handleTrendChange = (m) => {
    setTrendMonths(m)
    fetchAll(m)
  }

  useEffect(() => {
    fetchAll(trendMonths)
    intervalRef.current = setInterval(() => fetchAll(trendMonths), 10000)
    return () => clearInterval(intervalRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:'48px', height:'48px', border:'3px solid var(--border)', borderTopColor:'#3b82f6', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
        <p style={{ color:'var(--text-secondary)', fontSize:'14px' }}>Loading real-time analytics…</p>
      </div>
    </div>
  )

  const barData = [
    { name:'Total', value: data?.total_reports || 0 },
    { name:'Pending', value: data?.total_pending || 0 },
    { name:'Verified', value: data?.total_verified || 0 },
    { name:'Rejected', value: data?.total_rejected || 0 },
  ]

  const pieData = violations.map(v => ({ name: v.violation_type, value: v.count }))
  const monthlyTrend = data?.monthly_trend || []

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', paddingTop:'96px', fontFamily:'inherit' }}>
      <div style={{ maxWidth:'1440px', margin:'0 auto', padding:'32px 40px 64px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'32px', paddingBottom:'20px', borderBottom:'1.5px solid var(--border)' }}>
          <div>
            <span style={{ display:'inline-block', padding:'3px 12px', background:'var(--primary-bg)', color:'#1d4ed8', fontSize:'11px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', borderRadius:'999px', marginBottom:'10px' }}>
              {isCitizen ? 'Personal' : 'System-Wide'} Analytics
            </span>
            <h1 style={{ fontSize:'clamp(24px,3vw,34px)', fontWeight:900, color:'var(--text-primary)', margin:'0 0 4px', letterSpacing:'-0.4px' }}>
              {isCitizen ? 'My Traffic Analytics' : 'Police Command Analytics'}
            </h1>
            <p style={{ color:'var(--text-secondary)', fontSize:'14px', margin:0 }}>
              {isCitizen ? 'Personal report stats and civic score overview' : 'Real-time enforcement dashboard — Tamil Nadu Traffic Police'}
            </p>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', justifyContent:'flex-end', marginBottom:'4px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 0 3px rgba(34,197,94,0.2)' }}/>
              <span style={{ fontSize:'12px', color:'#16a34a', fontWeight:600 }}>Live — refreshes every 10s</span>
            </div>
            <p style={{ margin:0, fontSize:'11px', color:'var(--text-secondary)' }}>Last updated: {lastUpdate.toLocaleTimeString()}</p>
            <button onClick={fetchAll} style={{ marginTop:'6px', padding:'4px 14px', background:'#1d4ed8', color:'var(--bg-card)', border:'none', borderRadius:'8px', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>Refresh Now</button>
          </div>
        </div>

        {/* Citizen: Trust Score Banner */}
        {isCitizen && data?.trust_score !== undefined && (
          <div style={{ background:'linear-gradient(135deg, var(--text-primary) 0%, #1e3a8a 100%)', borderRadius:'18px', padding:'28px 32px', marginBottom:'28px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'20px' }}>
            <div>
              <p style={{ margin:'0 0 4px', fontSize:'11px', color:'rgba(255,255,255,0.6)', fontWeight:600, textTransform:'uppercase', letterSpacing:'1px' }}>Civic Trust Score</p>
              <p style={{ margin:'0 0 8px', fontSize:'52px', fontWeight:900, color:'var(--bg-card)', lineHeight:1 }}>{data.trust_score}</p>
              <span style={{ padding:'4px 12px', background:'rgba(255,255,255,0.12)', color:'var(--bg-card)', borderRadius:'999px', fontSize:'12px', fontWeight:600 }}>
                {data.trust_score >= 70 ? '✓ Trusted Citizen' : data.trust_score >= 50 ? 'Active Citizen' : 'New Citizen'}
              </span>
            </div>
            <div style={{ minWidth:'240px' }}>
              <p style={{ margin:'0 0 8px', fontSize:'11px', color:'rgba(255,255,255,0.6)', fontWeight:600, textTransform:'uppercase', letterSpacing:'1px' }}>Progress to 100</p>
              <div style={{ height:'10px', background:'rgba(255,255,255,0.15)', borderRadius:'999px', overflow:'hidden', marginBottom:'6px' }}>
                <div style={{ height:'100%', width:`${Math.min(data.trust_score,100)}%`, background:'linear-gradient(90deg,#10b981,#34d399)', borderRadius:'999px', transition:'width 0.6s' }}/>
              </div>
              <p style={{ margin:'0 0 8px', fontSize:'12px', color:'rgba(255,255,255,0.55)' }}>{data.trust_score}/100 points</p>
              <p style={{ margin:0, fontSize:'12px', color:'rgba(255,255,255,0.7)' }}>🎁 Reward Points: <strong style={{ color:'#fbbf24' }}>{data.reward_points || 0}</strong></p>
            </div>
          </div>
        )}

        {/* Police: Extra KPI banner */}
        {!isCitizen && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'16px', marginBottom:'28px' }}>
            {[
              { label:'Today\'s Reports', value: data?.daily_new || 0, icon:'📅', color:'#1d4ed8', bg:'var(--primary-bg)', border:'#bfdbfe' },
              { label:'This Week', value: data?.weekly_new || 0, icon:'📆', color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe' },
              { label:'Fines Collected', value:`₹${(data?.fines_collected||0).toLocaleString('en-IN')}`, icon:'💰', color:'#15803d', bg:'#f0fdf4', border:'#bbf7d0' },
              { label:'Fines Pending', value:`₹${(data?.fines_pending||0).toLocaleString('en-IN')}`, icon:'⏳', color:'#b45309', bg:'var(--bg-card)beb', border:'#fde68a' },
              { label:'Total Challans', value: data?.total_challans || 0, icon:'📋', color:'#0369a1', bg:'#f0f9ff', border:'#bae6fd' },
              { label:'Paid Challans', value: data?.paid_challans || 0, icon:'✅', color:'#15803d', bg:'#f0fdf4', border:'#bbf7d0' },
            ].map((c,i) => <StatCard key={i} {...c} />)}
          </div>
        )}

        {/* Summary Stat Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'16px', marginBottom:'28px' }}>
          <StatCard label="Total Reports" value={data?.total_reports||0} icon="📊" color="#1d4ed8" bg="var(--primary-bg)" border="#bfdbfe" sub="All time submissions"/>
          <StatCard label="Pending" value={data?.total_pending||0} icon="⏳" color="#b45309" bg="var(--bg-card)beb" border="#fde68a" sub="Awaiting review"/>
          <StatCard label="Verified" value={data?.total_verified||0} icon="✅" color="#15803d" bg="#f0fdf4" border="#bbf7d0" sub="Confirmed violations"/>
          <StatCard label="Rejected" value={data?.total_rejected||0} icon="❌" color="#b91c1c" bg="#fef2f2" border="#fecaca" sub="Insufficient evidence"/>
          {isCitizen && <StatCard label="Acceptance Rate" value={data?.total_reports > 0 ? `${Math.round((data.total_verified/data.total_reports)*100)}%` : '0%'} icon="🎯" color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" sub="Your report quality"/>}
        </div>

        {/* Charts Row 1 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'24px' }}>
          {/* Bar Chart */}
          <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)', borderRadius:'18px', padding:'26px' }}>
            <h2 style={{ fontSize:'15px', fontWeight:800, color:'var(--text-primary)', margin:'0 0 20px', textTransform:'uppercase', letterSpacing:'0.6px' }}>Report Status Overview</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-secondary)"/>
                <XAxis dataKey="name" tick={{ fontSize:12, fill:'var(--text-secondary)' }}/>
                <YAxis tick={{ fontSize:12, fill:'var(--text-secondary)' }}/>
                <Tooltip contentStyle={{ borderRadius:'10px', border:'1px solid var(--border)', fontSize:'13px' }}/>
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {barData.map((_,i) => <Cell key={i} fill={COLORS[i]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)', borderRadius:'18px', padding:'26px' }}>
            <h2 style={{ fontSize:'15px', fontWeight:800, color:'var(--text-primary)', margin:'0 0 20px', textTransform:'uppercase', letterSpacing:'0.6px' }}>Violation Type Breakdown</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name,percent})=>`${name}: ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {pieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius:'10px', border:'1px solid var(--border)', fontSize:'13px' }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height:'240px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', fontSize:'14px' }}>No violation data yet</div>
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)', borderRadius:'18px', padding:'26px', marginBottom:'24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
            <h2 style={{ fontSize:'15px', fontWeight:800, color:'var(--text-primary)', margin:0, textTransform:'uppercase', letterSpacing:'0.6px' }}>Report Trend</h2>
            <select
              value={trendMonths}
              onChange={e => handleTrendChange(Number(e.target.value))}
              style={{ padding:'6px 14px', borderRadius:'8px', border:'1.5px solid var(--border)', fontSize:'13px', fontWeight:600, color:'var(--text-primary)', background:'var(--bg-primary)', cursor:'pointer', outline:'none' }}
            >
              <option value={1}>Last 1 Month</option>
              <option value={3}>Last 3 Months</option>
              <option value={6}>Last 6 Months</option>
              <option value={12}>Last 12 Months</option>
            </select>
          </div>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-secondary)"/>
                <XAxis dataKey="month" tick={{ fontSize:12, fill:'var(--text-secondary)' }}/>
                <YAxis tick={{ fontSize:12, fill:'var(--text-secondary)' }}/>
                <Tooltip contentStyle={{ borderRadius:'10px', border:'1px solid var(--border)', fontSize:'13px' }}/>
                <Legend/>
                <Line type="monotone" dataKey="count" name="Total Reports" stroke="#3b82f6" strokeWidth={2.5} dot={{ r:4 }} activeDot={{ r:6 }}/>
                <Line type="monotone" dataKey="verified" name="Verified" stroke="#10b981" strokeWidth={2.5} dot={{ r:4 }} activeDot={{ r:6 }}/>
                {!isCitizen && <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r:3 }}/>}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:'220px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', fontSize:'14px' }}>No trend data for this period</div>
          )}
        </div>

        {/* Heatmap Map Section */}
        <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)', borderRadius:'18px', padding:'26px', marginBottom:'24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <div>
              <h2 style={{ fontSize:'15px', fontWeight:800, color:'var(--text-primary)', margin:0, textTransform:'uppercase', letterSpacing:'0.6px' }}>Violation Hotspots</h2>
              <p style={{ margin:'4px 0 0', fontSize:'13px', color:'var(--text-secondary)' }}>Real-time spatial distribution of reported traffic violations across Chennai</p>
            </div>
            <div style={{ padding:'6px 12px', background:'var(--bg-primary)', borderRadius:'8px', fontSize:'12px', fontWeight:700, color:'var(--text-primary)', border:'1.5px solid var(--border)' }}>
              📍 {heatmap.length} Active Hotspots
            </div>
          </div>
          <div style={{ height:'450px', borderRadius:'14px', overflow:'hidden', border:'1px solid var(--border)', position:'relative', zIndex:10 }}>
            <MapContainer center={[13.0827, 80.2707]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
              {heatmap.map((point, idx) => (
                <Marker key={idx} position={[point.lat, point.lng]}>
                  <Popup>
                    <div style={{ fontSize:'13px', width:'200px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                        <span style={{ fontSize:'10px', fontWeight:700, color:'#1d4ed8', textTransform:'uppercase', letterSpacing:'0.5px' }}>Report #{point.id}</span>
                        <span style={{ fontSize:'10px', padding:'2px 6px', background:point.status==='Verified'?'#f0fdf4':'#fffbeb', color:point.status==='Verified'?'#16a34a':'#b45309', borderRadius:'4px', fontWeight:700 }}>{point.status}</span>
                      </div>
                      <h4 style={{ margin:'0 0 4px', fontSize:'14px', fontWeight:800, color:'var(--text-primary)' }}>{point.violation_type}</h4>
                      <p style={{ margin:'0 0 8px', fontSize:'12px', color:'var(--text-secondary)' }}>📍 {point.location_address}</p>
                      <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:'8px', fontSize:'11px', color:'var(--text-secondary)', display:'flex', justifyContent:'space-between' }}>
                        <span>📅 {new Date(point.date).toLocaleDateString()}</span>
                        <span style={{ color:'#1d4ed8', cursor:'pointer', fontWeight:600 }}>View Details →</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <div style={{ marginTop:'16px', display:'flex', gap:'16px', flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'var(--text-secondary)' }}>
              <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:'#ef4444', opacity:0.6 }}/> Low Intensity
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'var(--text-secondary)' }}>
              <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:'#ef4444', opacity:0.8 }}/> High Intensity
            </div>
          </div>
        </div>



        {/* Violation Type Table */}
        {violations.length > 0 && (
          <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)', borderRadius:'18px', padding:'26px', marginBottom:'24px' }}>
            <h2 style={{ fontSize:'15px', fontWeight:800, color:'var(--text-primary)', margin:'0 0 20px', textTransform:'uppercase', letterSpacing:'0.6px' }}>Violation Type Breakdown</h2>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'var(--bg-primary)', borderBottom:'1.5px solid var(--border)' }}>
                    {['Violation Type','Count','Share','Trend'].map(h => (
                      <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.7px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v,i) => {
                    const total = violations.reduce((s,x)=>s+x.count,0)
                    const pct = total > 0 ? Math.round((v.count/total)*100) : 0
                    return (
                      <tr key={i} style={{ borderBottom:'1px solid var(--bg-secondary)' }}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--bg-primary)'}
                        onMouseLeave={e=>e.currentTarget.style.background='var(--bg-card)'}>
                        <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:600, color:'var(--text-primary)' }}>{v.violation_type}</td>
                        <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:800, color:COLORS[i%COLORS.length] }}>{v.count}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                            <div style={{ flex:1, height:'6px', background:'var(--bg-secondary)', borderRadius:'999px', overflow:'hidden', minWidth:'80px' }}>
                              <div style={{ width:`${pct}%`, height:'100%', background:COLORS[i%COLORS.length], borderRadius:'999px' }}/>
                            </div>
                            <span style={{ fontSize:'12px', fontWeight:700, color:'var(--text-secondary)', minWidth:'32px' }}>{pct}%</span>
                          </div>
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:'12px', color:'var(--text-secondary)' }}>Real-time</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Police: Officer Performance Table */}
        {!isCitizen && data?.top_officers?.length > 0 && (
          <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)', borderRadius:'18px', padding:'26px' }}>
            <h2 style={{ fontSize:'15px', fontWeight:800, color:'var(--text-primary)', margin:'0 0 20px', textTransform:'uppercase', letterSpacing:'0.6px' }}>Officer Performance</h2>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'var(--bg-primary)', borderBottom:'1.5px solid var(--border)' }}>
                    {['Rank','Officer','ID','Reports Verified','Reports Rejected'].map(h => (
                      <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.7px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.top_officers.map((o,i) => (
                    <tr key={i} style={{ borderBottom:'1px solid var(--bg-secondary)' }}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--bg-primary)'}
                      onMouseLeave={e=>e.currentTarget.style.background='var(--bg-card)'}>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ width:'28px', height:'28px', borderRadius:'50%', background: i===0?'#fef3c7':i===1?'var(--bg-secondary)':'var(--bg-primary)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'13px', color: i===0?'#b45309':'var(--text-secondary)' }}>
                          {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                        </span>
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:700, color:'var(--text-primary)' }}>{o.full_name}</td>
                      <td style={{ padding:'12px 16px', fontSize:'12px', fontFamily:'monospace', color:'var(--text-secondary)' }}>#{o.police_id}</td>
                      <td style={{ padding:'12px 16px', fontSize:'14px', fontWeight:900, color:'#15803d' }}>{o.total_verified||0}</td>
                      <td style={{ padding:'12px 16px', fontSize:'14px', fontWeight:700, color:'#b91c1c' }}>{o.total_rejected||0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Analytics
