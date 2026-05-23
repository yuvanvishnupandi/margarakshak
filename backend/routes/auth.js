const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required.' });
  }

  try {
    let user;
    let userIdField;
    let tableName;

    if (role === 'citizen') {
      tableName = 'CITIZENS';
      userIdField = 'citizen_id';
    } else if (role === 'police') {
      tableName = 'POLICE_OFFICERS';
      userIdField = 'badge_no';
    } else {
      return res.status(400).json({ error: 'Invalid role. Must be citizen or police.' });
    }

    const [rows] = await db.execute(
      `SELECT * FROM ${tableName} WHERE email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    user = rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const sessionId = require('crypto').randomBytes(32).toString('hex');
    const token = jwt.sign(
      {
        id: user[userIdField],
        email: user.email,
        full_name: user.full_name,
        role: role,
        session_id: sessionId
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Record session in ACTIVE_SESSIONS transient table
    try {
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
      await db.execute(
        `INSERT INTO ACTIVE_SESSIONS (session_id, user_id, user_role, ip_address, expires_at, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [
          sessionId,
          String(user[userIdField]),
          role === 'citizen' ? 'Citizen' : 'Police',
          req.ip || req.connection.remoteAddress || null,
          expiresAt
        ]
      );
    } catch (se) { console.warn('Session insert skipped:', se.message); }

    res.json({
      token,
      user: {
        id: user[userIdField],
        full_name: user.full_name,
        name: user.full_name,
        email: user.email,
        role: role,
        trust_score: role === 'citizen' ? user.trust_score : undefined,
        reward_points: role === 'citizen' ? user.reward_points : undefined,
        badge_number: role === 'police' ? user.badge_no : undefined,
        station: role === 'police' ? user.station_code : undefined
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// POST /api/auth/logout — deactivate session
router.post('/logout', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.session_id) {
        await db.execute(
          `UPDATE ACTIVE_SESSIONS SET is_active = 0 WHERE session_id = ?`,
          [decoded.session_id]
        );
      }
    } catch (e) { /* token expired or invalid — ignore */ }
  }
  res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { id, role } = decoded;

    let user;
    if (role === 'citizen') {
      const [rows] = await db.execute(
        'SELECT citizen_id AS id, full_name AS name, email, trust_score, phone_no AS phone, NULL AS address FROM CITIZENS WHERE citizen_id = ?',
        [id]
      );
      user = rows[0];
    } else {
      const [rows] = await db.execute(
        'SELECT badge_no AS id, full_name AS name, email, badge_number, station_code AS station FROM POLICE_OFFICERS WHERE badge_no = ?',
        [id]
      );
      user = rows[0];
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ ...user, role });
  } catch (err) {
    res.status(403).json({ error: 'Invalid token.' });
  }
});

// GET /api/auth/profile — same as /me, returns full_name too
router.get('/profile', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { id, role } = decoded;
    let user;
    if (role === 'citizen') {
      const [rows] = await db.execute(
        `SELECT citizen_id AS id, full_name, full_name AS name, email,
                trust_score, reward_points, wallet_balance, phone_no AS phone, account_status
         FROM CITIZENS WHERE citizen_id=?`, [id]
      );
      user = rows[0];
    } else {
      const [rows] = await db.execute(
        `SELECT badge_no AS id, full_name, full_name AS name, email,
                badge_no AS badge_number, station_code AS station
         FROM POLICE_OFFICERS WHERE badge_no=?`, [id]
      );
      user = rows[0];
    }
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ ...user, role });
  } catch (err) {
    res.status(403).json({ error: 'Invalid token.' });
  }
});

// PUT /api/auth/profile — update profile
router.put('/profile', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { id, role } = decoded;
    const { full_name, phone_no, phone } = req.body;
    const phoneVal = phone_no || phone || null;
    if (role === 'citizen') {
      await db.execute(
        `UPDATE CITIZENS SET full_name=COALESCE(?,full_name), phone_no=COALESCE(?,phone_no) WHERE citizen_id=?`,
        [full_name || null, phoneVal, id]
      );
    } else {
      await db.execute(
        `UPDATE POLICE_OFFICERS SET full_name=COALESCE(?,full_name) WHERE badge_no=?`,
        [full_name || null, id]
      );
    }
    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile: ' + err.message });
  }
});

module.exports = router;
