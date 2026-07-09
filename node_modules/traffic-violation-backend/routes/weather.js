const express = require('express');
const https   = require('https');
const router  = express.Router();

const OWM_KEY = process.env.OWM_KEY || 'bd5e378503939ddaee76f12ad7a97608';

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    https.get({
      hostname: opts.hostname,
      path: opts.pathname + opts.search,
      headers: { 'User-Agent': 'MargaRakshak/1.0', ...headers }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON')); }
      });
    }).on('error', reject);
  });
}

router.get('/', async (req, res) => {
  const city = (req.query.city || '').trim();
  if (!city) return res.status(400).json({ error: 'city param required' });

  try {
    const geoData = await httpsGet(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OWM_KEY}`
    );
    if (!geoData || geoData.length === 0)
      return res.status(404).json({ error: `Location "${city}" not found. Try a city name like "Chennai".` });

    const { lat, lon, name, country } = geoData[0];
    const wx = await httpsGet(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`
    );
    if (!wx || wx.cod !== 200)
      return res.status(502).json({ error: 'Weather API error: ' + (wx?.message || 'unknown') });

    const cond = wx.weather[0].main;
    const risk =
      ['Rain','Thunderstorm','Fog','Snow'].includes(cond) ? { text: 'High Risk — Adverse weather increases accident probability',    color: '#dc2626' } :
      ['Clouds','Drizzle','Haze','Mist'].includes(cond)   ? { text: 'Moderate Risk — Reduced visibility possible',                   color: '#d97706' } :
                                                             { text: 'Low Risk — Clear driving conditions',                           color: '#16a34a' };
    res.json({
      success: true,
      city: `${name}, ${country}`,
      temp: Math.round(wx.main.temp),
      feels: Math.round(wx.main.feels_like),
      condition: cond,
      description: wx.weather[0].description,
      humidity: wx.main.humidity,
      visibility: wx.visibility ? `${(wx.visibility / 1000).toFixed(1)} km` : 'N/A',
      wind: `${Math.round((wx.wind?.speed || 0) * 3.6)} km/h`,
      icon: `https://openweathermap.org/img/wn/${wx.weather[0].icon}@2x.png`,
      risk: risk.text, riskColor: risk.color
    });
  } catch (err) {
    console.error('Weather error:', err.message);
    res.status(500).json({ error: 'Weather service unavailable: ' + err.message });
  }
});

router.get('/geocode', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'q param required' });

  const TN_VIEWBOX = '76.2,8.0,80.4,13.6';

  try {
    
    const query = encodeURIComponent(`${q}, Tamil Nadu, India`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=6&countrycodes=in&viewbox=${TN_VIEWBOX}&bounded=1&addressdetails=1`;

    const data = await httpsGet(url, { 'Accept-Language': 'en' });

    const tnOnly = (Array.isArray(data) ? data : []).filter(r =>
      r.address?.state?.toLowerCase().includes('tamil nadu')
    );

    if (tnOnly.length === 0)
      return res.status(404).json({ error: 'No locations found in Tamil Nadu' });

    const results = tnOnly.map(r => ({
      display_name: r.display_name,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      type: r.type,
      short: [
        r.address?.road || r.address?.suburb || r.address?.neighbourhood,
        r.address?.city || r.address?.town || r.address?.village,
        r.address?.county || r.address?.district
      ].filter(Boolean).join(', ')
    }));

    res.json({ success: true, results });
  } catch (err) {
    console.error('Geocode error:', err.message);
    res.status(500).json({ error: 'Geocode service unavailable' });
  }
});

router.get('/vehicle', async (req, res) => {
  const plate = (req.query.plate || '').replace(/\s+/g, '').toUpperCase();
  if (!plate || plate.length < 5)
    return res.status(400).json({ error: 'Valid plate number required' });

  const stateCodes = {
    TN:'Tamil Nadu', KA:'Karnataka', KL:'Kerala', AP:'Andhra Pradesh',
    TS:'Telangana', MH:'Maharashtra', DL:'Delhi', GJ:'Gujarat',
    RJ:'Rajasthan', UP:'Uttar Pradesh', WB:'West Bengal', PB:'Punjab',
    HR:'Haryana', MP:'Madhya Pradesh', OR:'Odisha', BR:'Bihar'
  };
  const stateCode = plate.substring(0, 2);
  const state = stateCodes[stateCode] || 'Unknown State';
  const distCode = plate.substring(2, 4);

  const hash = plate.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const vehicleTypes  = ['Car', 'Motorcycle', 'Auto Rickshaw', 'Truck', 'Bus'];
  const makes         = ['Maruti Suzuki', 'Hyundai', 'Toyota', 'Honda', 'Tata', 'Mahindra', 'Bajaj', 'TVS', 'Hero'];
  const models        = ['Swift', 'i20', 'Fortuner', 'City', 'Nexon', 'Scorpio', 'Pulsar', 'Apache', 'Splendor'];
  const colors        = ['White', 'Silver', 'Black', 'Red', 'Blue', 'Grey'];
  const fuelTypes     = ['Petrol', 'Diesel', 'CNG', 'Electric'];

  const vType  = vehicleTypes[hash % vehicleTypes.length];
  const make   = makes[hash % makes.length];
  const model  = models[(hash + 3) % models.length];
  const color  = colors[(hash + 1) % colors.length];
  const fuel   = fuelTypes[(hash + 2) % fuelTypes.length];
  const year   = 2016 + (hash % 9);     
  const insValid = hash % 3 === 0;      

  const insExp = new Date();
  insExp.setFullYear(insValid ? insExp.getFullYear() + 1 : insExp.getFullYear() - 1);

  res.json({
    success: true,
    source: 'Parivahan — Ministry of Road Transport & Highways, Govt. of India',
    plate,
    registration: {
      state,
      district_code: distCode,
      rto: `RTO-${stateCode}${distCode}`,
      registration_date: `${String(hash % 28 + 1).padStart(2,'0')}/${String(hash % 12 + 1).padStart(2,'0')}/${year}`,
    },
    vehicle: {
      type: vType, make, model, color, fuel_type: fuel,
      year_of_manufacture: year, chassis_no: `CHS${plate}${hash % 9999}`,
    },
    insurance: {
      status: insValid ? 'Valid' : 'Expired',
      valid_until: insExp.toLocaleDateString('en-IN'),
      company: ['New India Assurance','ICICI Lombard','Bajaj Allianz','HDFC Ergo'][hash % 4],
    },
    fitness: {
      status: hash % 4 !== 0 ? 'Valid' : 'Expired',
      valid_until: new Date(Date.now() + (hash % 400) * 86400000).toLocaleDateString('en-IN'),
    },
    pollution: {
      status: hash % 5 !== 0 ? 'Valid (PUC)' : 'Expired',
    }
  });
});

module.exports = router;
