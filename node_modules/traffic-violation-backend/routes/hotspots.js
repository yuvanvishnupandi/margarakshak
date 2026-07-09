const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/predictive', authenticateToken, async (req, res) => {
  try {
    const district = req.user?.district || 'Sivagangai';
    
    // In a real AI system, this would query a Python ML microservice or an advanced AI engine.
    // Here we generate simulated predictive hotspots based on the district for demonstration.
    
    // Get recent violation counts to weight the predictions
    const [rows] = await db.execute(
      `SELECT violation_type, COUNT(*) as count 
       FROM REPORTS 
       WHERE district = ? AND status IN ('Verified', 'Pending')
       GROUP BY violation_type ORDER BY count DESC LIMIT 3`,
      [district]
    );
    
    const topViolation = rows.length > 0 ? rows[0].violation_type : 'Speeding';
    
    let baseHotspots = [];
    if (district === 'Chennai') {
      baseHotspots = [
        { location: 'Anna Salai & Mount Road Junction', riskLevel: 'Critical', confidence: 94, recommendedAction: 'Deploy Interceptor Vehicle', peakTime: 'Today 18:00 - 21:00' },
        { location: 'OMR Toll Plaza Approach', riskLevel: 'High', confidence: 88, recommendedAction: 'Stationary Speed Camera Monitoring', peakTime: 'Today 17:30 - 20:30' },
        { location: 'Marina Beach Road', riskLevel: 'Medium', confidence: 76, recommendedAction: 'Routine Patrol Sweep', peakTime: 'Tonight 22:00 - 01:00' }
      ];
    } else if (district === 'Sivagangai') {
      baseHotspots = [
        { location: 'Madurai-Sivagangai Highway', riskLevel: 'Critical', confidence: 92, recommendedAction: 'Deploy Speed Checkpost', peakTime: 'Today 19:00 - 23:00' },
        { location: 'Aranmanai Siruvayal Junction', riskLevel: 'High', confidence: 85, recommendedAction: 'Routine Patrol Sweep', peakTime: 'Tomorrow 08:00 - 10:00' }
      ];
    } else {
      baseHotspots = [
        { location: 'Main Arterial Road', riskLevel: 'Critical', confidence: 91, recommendedAction: 'Deploy Interceptor Vehicle', peakTime: 'Today 17:00 - 20:00' },
        { location: 'City Center Market Area', riskLevel: 'High', confidence: 82, recommendedAction: 'Foot Patrol', peakTime: 'Tomorrow 10:00 - 13:00' }
      ];
    }

    // Attach dynamic violation insight
    baseHotspots[0].insight = `Spike in ${topViolation} expected due to weekend traffic patterns.`;
    
    res.json({
      district,
      timestamp: new Date().toISOString(),
      predictions: baseHotspots
    });
    
  } catch (err) {
    console.error('Predictive hotspot error:', err);
    res.status(500).json({ error: 'Failed to generate predictive hotspots' });
  }
});

module.exports = router;
