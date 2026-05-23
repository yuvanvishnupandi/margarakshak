const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'traffic_violation_secret_key_2024';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

function requireCitizen(req, res, next) {
  if (req.user.role !== 'citizen') {
    return res.status(403).json({ error: 'Citizen access required.' });
  }
  next();
}

function requirePolice(req, res, next) {
  if (req.user.role !== 'police') {
    return res.status(403).json({ error: 'Police access required.' });
  }
  next();
}

module.exports = { authenticateToken, requireCitizen, requirePolice, JWT_SECRET };
