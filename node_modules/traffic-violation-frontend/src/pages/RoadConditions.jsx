import { useState, useEffect } from 'react'

function RoadConditions() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const getWeatherDetails = (code) => {
    if (code === 0) return { label: 'Clear Sky', icon: '☀️', hazard: 'None', color: '#38bdf8', bg: '#e0f2fe' }
    if (code === 1 || code === 2 || code === 3) return { label: 'Partly Cloudy', icon: '⛅', hazard: 'None', color: '#94a3b8', bg: '#f1f5f9' }
    if (code === 45 || code === 48) return { label: 'Foggy', icon: '🌫️', hazard: 'High - Low Visibility', color: '#fb923c', bg: '#ffedd5' }
    if (code >= 51 && code <= 67) return { label: 'Raining', icon: '🌧️', hazard: 'Moderate - Slippery Roads', color: '#60a5fa', bg: '#eff6ff' }
    if (code >= 71 && code <= 77) return { label: 'Snow', icon: '❄️', hazard: 'Severe - Black Ice', color: '#c084fc', bg: '#faf5ff' }
    if (code >= 80 && code <= 82) return { label: 'Heavy Rain Showers', icon: '⛈️', hazard: 'Severe - Hydroplaning Risk', color: '#f87171', bg: '#fef2f2' }
    if (code >= 95) return { label: 'Thunderstorm', icon: '🌩️', hazard: 'Severe - Do Not Drive', color: '#dc2626', bg: '#fef2f2' }
    return { label: 'Unknown', icon: '🌡️', hazard: 'Unknown', color: '#94a3b8', bg: '#f1f5f9' }
  }

  const [locationName, setLocationName] = useState('Fetching location...')

  useEffect(() => {
    const getWeatherData = async (lat, lon) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        if (!res.ok) throw new Error('Failed to fetch weather data')
        const data = await res.json()
        setWeather(data.current_weather)

        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        const geoData = await geoRes.json()
        const city = geoData.address?.city || geoData.address?.town || geoData.address?.state_district || 'Your Location'
        setLocationName(city)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => getWeatherData(pos.coords.latitude, pos.coords.longitude),
        () => {
          setLocationName('Chennai (GPS Denied, Default Location)')
          getWeatherData(13.0827, 80.2707) 
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      setLocationName('Chennai (GPS Not Supported)')
      getWeatherData(13.0827, 80.2707)
    }
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '50px', height: '50px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#94a3b8', fontSize: '15px', fontWeight: 600, letterSpacing: '0.5px', margin: 0 }}>Pinpointing GPS & Fetching API...</p>
      </div>
    </div>
  )

  const details = weather ? getWeatherDetails(weather.weathercode) : null

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: `linear-gradient(135deg, ${details.bg} 0%, #0f172a 100%)`, 
      paddingTop: '100px', paddingBottom: '60px',
      color: '#fff',
      transition: 'background 0.5s ease'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
        
        {}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: '99px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%', boxShadow: '0 0 0 3px rgba(52,211,153,0.2)' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Live API Connected</span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-1px', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>Live Road Conditions</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '17px', margin: 0, fontWeight: 500 }}>
            Meteorological safety analysis for <strong>{locationName}</strong>
          </p>
        </div>

        {error ? (
          <div style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)', padding: '24px', borderRadius: '16px', color: '#fca5a5', backdropFilter: 'blur(10px)' }}>
            <p style={{ margin: 0, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>API Connection Error</p>
            <p style={{ margin: '8px 0 0', fontSize: '15px' }}>{error}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {}
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px', 
              padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backdropFilter: 'blur(20px)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: `radial-gradient(circle, ${details.color}30 0%, transparent 60%)`, opacity: 0.5, pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 800, color: details.color, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 12px' }}>Current Weather</p>
                <h2 style={{ fontSize: '56px', fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-1px' }}>{details.label}</h2>
                <p style={{ fontSize: '32px', fontWeight: 800, color: 'rgba(255,255,255,0.9)', margin: 0 }}>{weather.temperature}°C</p>
              </div>
              <div style={{ fontSize: '120px', lineHeight: 1, filter: `drop-shadow(0 20px 30px ${details.color}50)`, position: 'relative', zIndex: 1 }}>
                {details.icon}
              </div>
            </div>

            {}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '36px', backdropFilter: 'blur(10px)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="24" height="24" fill="none" stroke={details.color} strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                Road Safety Assessment
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px' }}>Hazard Level</p>
                  <p style={{ fontSize: '20px', fontWeight: 900, color: details.hazard.includes('Severe') ? '#fca5a5' : details.hazard.includes('Moderate') || details.hazard.includes('High') ? '#fcd34d' : '#6ee7b7', margin: 0 }}>
                    {details.hazard}
                  </p>
                </div>
                
                <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px' }}>Wind Speed</p>
                  <p style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: 0 }}>
                    {weather.windspeed} <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>km/h</span>
                  </p>
                </div>
              </div>
            </div>

            {}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.5px' }}>
                LIVE DATA SECURED FROM <strong style={{ color: 'rgba(255,255,255,0.5)' }}>OPEN-METEO API</strong> &bull; {new Date().toLocaleTimeString()}
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

export default RoadConditions
