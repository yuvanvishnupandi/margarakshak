import { useEffect, useRef, useState, memo, useCallback } from 'react'
import yoloDemo from '../assets/videos/yolo_demo1.mp4'
import yoloSpeed from '../assets/videos/yolo_speed.mp4'

let sharedObserver = null
function getObserver() {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.style.opacity = '1'
            e.target.style.transform = 'translateY(0)'
            sharedObserver.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    )
  }
  return sharedObserver
}

function useSR(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = getObserver()
    obs.observe(el)
    return () => obs.unobserve(el)
  }, [ref])
}

function SR({ children, delay = 0, style = {} }) {
  const ref = useRef(null)
  useSR(ref)
  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: 'translateY(24px)',
        transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
        willChange: 'opacity, transform',
        ...style
      }}
    >
      {children}
    </div>
  )
}

const VideoCard = memo(({ src, title, subtitle, badge, isLive, stats }) => {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {})
          setPlaying(true)
        } else {
          video.pause()
          setPlaying(false)
        }
      },
      { threshold: 0.25 }
    )
    obs.observe(video)
    return () => obs.disconnect()
  }, [])

  return (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      border: '1.5px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.07)'
    }}>
      {}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>{title}</h2>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{subtitle}</p>
      </div>

      {}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="none"           
          controls
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: isLive ? 'rgba(22,163,74,0.92)' : 'rgba(220,38,38,0.92)',
          color: '#fff', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px',
          padding: '4px 10px', borderRadius: '6px',
          display: 'flex', alignItems: 'center', gap: '5px'
        }}>
          {}
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#fff', display: 'inline-block'
          }} />
          {isLive ? 'LIVE' : 'TRACKING'}
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', padding: '14px 16px', background: '#f8fafc' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
})
VideoCard.displayName = 'VideoCard'

function FeatureCard({ feature, delay }) {
  const ref = useRef(null)
  useSR(ref)

  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: 'translateY(20px)',
        transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
        background: '#fff',
        borderRadius: '24px',
        padding: '40px',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}
    >
      <h3 style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', margin: '0 0 24px' }}>{feature.title}</h3>
      <p style={{ fontSize: '18px', color: '#64748b', lineHeight: 1.6, margin: '0 0 32px' }}>{feature.description}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {feature.tech.map((t, i) => (
          <span key={i} style={{
            padding: '6px 16px', background: '#eff6ff', color: '#1d4ed8',
            borderRadius: '999px', fontSize: '14px', fontWeight: 700
          }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

const features = [
  { title: 'YOLO v11 Object Tracking', description: 'AI-powered real-time vehicle detection from CCTV feeds. Identifies vehicles, pedestrians, and violations automatically.', tech: ['Computer Vision', 'Deep Learning', 'Real-time'] },
  { title: 'Automated Speed Checking', description: 'Frame-by-frame speed calculation with auto-alert and challan generation when speed limits are exceeded.', tech: ['Motion Detection', 'Speed Calc', 'Alert System'] },
  { title: 'Vehicle Counting & Analytics', description: 'Real-time vehicle counting with peak-hour insights, congestion pattern detection, and optimal signal timing.', tech: ['Data Analytics', 'Traffic Flow', 'Predictive ML'] },
  { title: 'IoT Road Sensors', description: 'Smart sensors in roads for weight, speed, and vehicle classification — enabling automated toll and overload detection.', tech: ['IoT', 'Smart Infra', 'Edge Computing'] },
  { title: 'ANPR Integration', description: 'Automatic Number Plate Recognition that cross-references DB for stolen vehicles, expired insurance, and wanted suspects.', tech: ['OCR', 'Pattern Recog', 'DB Matching'] },
  { title: 'Smart Signal Control', description: 'AI-driven adaptive traffic signal timing based on real-time density. Reduces congestion intelligently.', tech: ['Machine Learning', 'IoT', 'Traffic Opt'] },
  { title: 'Biometric Verification', description: 'Face recognition and fingerprint auth for tamper-proof citizen login and report submissions.', tech: ['Face Recognition', 'Fingerprint', 'Liveness'] },
  { title: 'Blockchain Evidence Chain', description: 'Immutable blockchain ledger for violation evidence — tamper-proof records admissible in court.', tech: ['Blockchain', 'IPFS', 'Smart Contracts'] },
  { title: 'AI Predictive Hotspot Engine', description: 'ML model predicting high-risk zones before accidents using historical data, weather, and traffic patterns.', tech: ['Predictive ML', 'GIS Mapping', 'Risk Analytics'] }
]

const phases = [
  { color: '#16a34a', label: 'Phase 1 — Foundation (Completed)', desc: 'Citizen reporting, Police verification, Challan pipeline, Trust score system' },
  { color: '#2563eb', label: 'Phase 2 — AI Integration (Current)', desc: 'YOLO v11, Automated detection, Real-time monitoring, Speed checking' },
  { color: '#7c3aed', label: 'Phase 3 — Smart Infrastructure', desc: 'IoT road sensors, ANPR cameras, Smart signal control, Predictive analytics' },
  { color: '#d97706', label: 'Phase 4 — Full Automation', desc: 'Complete AI-driven traffic management, Zero human intervention, Self-learning system' }
]

export default function FutureScopes() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: '128px', paddingBottom: '64px', paddingLeft: '32px', paddingRight: '32px' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>

        {}
        <SR style={{ textAlign: 'center', marginBottom: '80px' }}>
          <span style={{ display: 'inline-block', padding: '4px 14px', background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '999px', marginBottom: '14px' }}>
            Research & Development
          </span>
          <h1 style={{ fontSize: 'clamp(40px,6vw,72px)', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 12px', letterSpacing: '-1px' }}>
            Future Scopes
          </h1>
          <p style={{ fontSize: '24px', color: 'var(--text-secondary)', margin: 0 }}>
            Next-Generation Traffic Intelligence
          </p>
        </SR>

        {}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '32px', marginBottom: '80px' }}>
          <VideoCard
            src={yoloDemo}
            title="YOLO v11 Object Tracking"
            subtitle="Real-time vehicle detection and classification"
            badge="Object Detection"
            isLive={true}
            stats={[
              { value: '99.2%', label: 'Accuracy', color: '#2563eb' },
              { value: '30 FPS', label: 'Speed', color: '#16a34a' },
              { value: '80+', label: 'Classes', color: '#7c3aed' }
            ]}
          />
          <VideoCard
            src={yoloSpeed}
            title="Real-time Speed Detection"
            subtitle="Automated speed monitoring and violation capture"
            badge="Speed Analysis"
            isLive={false}
            stats={[
              { value: '±2 km/h', label: 'Precision', color: '#ea580c' },
              { value: 'Auto', label: 'Challan', color: '#dc2626' },
              { value: '24/7', label: 'Monitoring', color: '#ca8a04' }
            ]}
          />
        </div>

        {}
        <SR style={{ marginBottom: '64px' }}>
          <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, color: 'var(--text-primary)', textAlign: 'center', margin: 0 }}>
            Upcoming Features
          </h2>
        </SR>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '40px', marginBottom: '80px' }}>
          {features.map((f, i) => (
            <FeatureCard key={i} feature={f} delay={i * 40} />
          ))}
        </div>

        {}
        <SR style={{ marginBottom: '64px' }}>
          <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, color: 'var(--text-primary)', textAlign: 'center', margin: 0 }}>
            Development Roadmap
          </h2>
        </SR>

        <SR delay={80} style={{ marginBottom: '80px' }}>
          <div style={{ background: '#fff', borderRadius: '28px', border: '1.5px solid #e2e8f0', padding: '64px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            {phases.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: '32px', paddingBottom: i < phases.length - 1 ? '48px' : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: p.color, flexShrink: 0, marginTop: 4 }} />
                  {i < phases.length - 1 && <div style={{ width: 4, flex: 1, background: `${p.color}40`, marginTop: 6 }} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '28px', fontWeight: 800, color: p.color, margin: '0 0 8px' }}>{p.label}</h3>
                  <p style={{ fontSize: '18px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SR>

        {}
        <SR delay={100}>
          <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #4f46e5 100%)', borderRadius: '28px', padding: '64px', textAlign: 'center', boxShadow: '0 8px 40px rgba(30,64,175,0.3)' }}>
            <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>Join the Revolution</h2>
            <p style={{ fontSize: '22px', color: 'rgba(255,255,255,0.85)', margin: '0 0 48px' }}>Be part of the future of intelligent traffic management</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
              {['9 Features Planned', '4 Development Phases', '100% AI-Powered'].map(label => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: '16px', padding: '16px 32px' }}>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: '18px', margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </SR>

      </div>
    </div>
  )
}
