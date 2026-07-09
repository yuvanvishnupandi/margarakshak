import { Card } from '../components/ui/BaseComponents'

function About() {
  const missionCards = [
    {
      title: 'Our Mission',
      desc: 'To create safer roads through community-powered enforcement. Every citizen becomes a guardian, every report makes a difference.',
      accent: 'var(--accent)'
    },
    {
      title: 'How It Works',
      desc: 'Citizens submit violations → Police verify and issue challans → Offenders pay fines → Trust Scores reward responsible citizens.',
      accent: '#10b981'
    },
    {
      title: 'Key Innovation',
      desc: 'Trust Score mechanism rewards accurate reporting (+10 pts) and penalizes false reports (−10 pts), ensuring quality submissions.',
      accent: '#f59e0b'
    },
    {
      title: 'The Future',
      desc: 'AI-powered YOLO detection, automated speed checking, biometric verification, and predictive analytics for full automation.',
      accent: '#6366f1'
    },
    {
      title: 'Impact Goals',
      desc: 'Targeting 30% reduction in repeat violations within 1 year. Every verified report contributes to safer roads for all citizens.',
      accent: '#ef4444'
    },
    {
      title: 'Privacy & Security',
      desc: 'All citizen data is encrypted and handled under official data protection guidelines. Reports are anonymized for public dashboards.',
      accent: '#8b5cf6'
    }
  ]

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingTop: '144px' }}>
      <div className="max-w-[1440px] mx-auto px-8">
        
        {}
        <div className="text-center mb-20">
          <span style={{ 
            background: 'var(--accent-light)', 
            color: 'var(--accent)', 
            padding: '6px 16px', 
            borderRadius: '99px', 
            fontSize: '12px', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '1px' 
          }}>
            About the Platform
          </span>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '64px', fontWeight: 900, marginTop: '24px', letterSpacing: '-1.5px' }}>
            What is Marga Rakshak?
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '20px', maxWidth: '800px', margin: '16px auto 0', lineHeight: 1.6 }}>
            Bridging citizens and law enforcement through participatory traffic management
          </p>
        </div>

        {}
        <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', borderRadius: '24px', padding: '48px', marginBottom: '40px', display: 'flex', gap: '32px', alignItems: 'center', boxShadow: '0 24px 48px rgba(30,58,138,0.25)' }} className="flex-col md:flex-row">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#22c55e', width: '10px', height: '10px', borderRadius: '50%', boxShadow: '0 0 0 4px rgba(34,197,94,0.2)' }} />
              <span style={{ color: '#60a5fa', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>National Registry Connected</span>
            </div>
            <h2 style={{ color: '#fff', fontSize: '32px', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.5px' }}>
              Integrated with MoRTH Database
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', lineHeight: 1.6, margin: 0, maxWidth: '600px' }}>
              Marga Rakshak is designed with enterprise-grade architecture that securely connects to the <strong>Ministry of Road Transport and Highways (MoRTH)</strong> databases. 
              <br/><br/>
              When an officer searches a number plate, the system instantly queries the national <strong>VAHAN</strong> (Vehicle Registration) and <strong>SARATHI</strong> (Driving License) databases to retrieve verified owner details and issue official challans automatically.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '24px', borderRadius: '16px', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
            <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Live Connection Status</p>
            <div style={{ display: 'flex', gap: '16px' }}>
               <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 24px', borderRadius: '12px', textAlign: 'center' }}>
                 <p style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 900, color: '#34d399' }}>VAHAN</p>
                 <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Vehicle Registry</p>
               </div>
               <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 24px', borderRadius: '12px', textAlign: 'center' }}>
                 <p style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 900, color: '#60a5fa' }}>SARATHI</p>
                 <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>License DB</p>
               </div>
            </div>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          {missionCards.map((card, idx) => (
            <div 
              key={idx} 
              style={{ 
                background: 'var(--bg-card)', 
                borderRadius: '32px', 
                padding: '40px', 
                border: '1.5px solid var(--border)',
                position: 'relative',
                overflow: 'hidden'
              }}
              className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              <div style={{ 
                position: 'absolute', 
                top: '40px', 
                left: '40px', 
                width: '4px', 
                height: '32px', 
                background: card.accent,
                borderRadius: '4px'
              }} />
              <div className="pl-6">
                <h3 style={{ color: 'var(--text-primary)', fontSize: '22px', fontWeight: 800, marginBottom: '16px' }}>
                  {card.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '15px' }}>
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {}
        <div className="zigzag-divider zigzag-bottom" style={{ 
          height: '60px', 
          background: '#1d4ed8',
          marginTop: '64px',
          marginBottom: '-1px'
        }}></div>

        {}
        <div style={{ 
          background: '#1d4ed8', 
          padding: '100px 0', 
          borderRadius: '0 0 64px 64px',
          color: 'white'
        }}>
          <div className="max-w-[1000px] mx-auto text-center px-8">
            <h2 style={{ color: 'var(--text-primary)', fontSize: '42px', fontWeight: 900, marginBottom: '32px' }}>
              Impact Goals
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px', lineHeight: 1.8, marginBottom: '48px' }}>
              We are targeting a <strong>30% reduction</strong> in repeat traffic violations within the first year of deployment. 
              By turning every citizen into a guardian of the road, we create a self-sustaining ecosystem of safety.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { val: '30%', label: 'Violation Drop' },
                { val: '24/7', label: 'Monitoring' },
                { val: '100%', label: 'Transparency' }
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1.5px solid var(--border)' }}>
                  <p style={{ color: 'var(--accent)', fontSize: '36px', fontWeight: 900, margin: 0 }}>{s.val}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', marginTop: '8px' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {}
        <div className="py-20 text-center">
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: '#0a0a0a', 
            borderRadius: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 24px',
            color: 'white',
            fontSize: '24px',
            fontWeight: 900,
            transform: 'rotate(-10deg)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.2)'
          }}>
            Y
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Built with ❤️ for a safer tomorrow</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>
            Yuvan Vishnu Pandi
          </p>
        </div>
      </div>

      {}
      <div style={{ 
        height: '100px', 
        background: 'var(--bg-secondary)', 
        clipPath: 'polygon(100% 0, 0 0, 0 100%, 5% 90%, 10% 100%, 15% 90%, 20% 100%, 25% 90%, 30% 100%, 35% 90%, 40% 100%, 45% 90%, 50% 100%, 55% 90%, 60% 100%, 65% 90%, 70% 100%, 75% 90%, 80% 100%, 85% 90%, 90% 100%, 95% 90%, 100% 100%)' 
      }} />
    </div>
  )
}

export default About
