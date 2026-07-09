const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const TOKEN_EXPIRY = '8h';
const PASSWORD_MIN_LENGTH = 6;
const VEHICLE_TYPES = new Set(['Car', 'Motorcycle', 'Truck', 'Bus', 'Auto-Rickshaw', 'Bicycle', 'Other']);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePlate(plateNo) {
  return String(plateNo || '').trim().toUpperCase().replace(/\s+/g, '');
}

function normalizeVehicleType(vehicleType) {
  const value = String(vehicleType || '').trim();
  return VEHICLE_TYPES.has(value) ? value : 'Other';
}

function validatePassword(password, confirmPassword) {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }

  if (confirmPassword && password !== confirmPassword) {
    return 'Passwords do not match.';
  }

  return null;
}

async function createBadgeNo(conn) {
  for (let i = 0; i < 8; i += 1) {
    const badgeNo = `POL-${crypto.randomInt(100000, 999999)}`;
    const [[existing]] = await conn.execute(
      'SELECT badge_no FROM POLICE_OFFICERS WHERE badge_no = ?',
      [badgeNo]
    );
    if (!existing) return badgeNo;
  }

  return `POL-${Date.now().toString().slice(-10)}`;
}

async function createAuthPayload(conn, user, role, req) {
  const idField = role === 'citizen' ? 'citizen_id' : 'badge_no';
  const sessionId = crypto.randomBytes(32).toString('hex');
  const token = jwt.sign(
    {
      id: user[idField],
      email: user.email,
      full_name: user.full_name,
      role,
      district: user.district,
      session_id: sessionId
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  try {
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    await conn.execute(
      `INSERT INTO ACTIVE_SESSIONS (session_id, user_id, user_role, ip_address, expires_at, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        sessionId,
        String(user[idField]),
        role === 'citizen' ? 'Citizen' : 'Police',
        req.ip || req.connection.remoteAddress || null,
        expiresAt
      ]
    );
  } catch (se) {
    console.warn('Session insert skipped:', se.message);
  }

  return {
    token,
    user: {
      id: user[idField],
      full_name: user.full_name,
      name: user.full_name,
      email: user.email,
      role,
      district: user.district,
      trust_score: role === 'citizen' ? user.trust_score : undefined,
      reward_points: role === 'citizen' ? user.reward_points : undefined,
      badge_number: role === 'police' ? user.badge_no : undefined,
      station: role === 'police' ? user.station_code : undefined
    }
  };
}

router.post('/google-login', async (req, res) => {
  const { email, full_name, role } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  let conn;
  try {
    conn = await db.getConnection();
    const idField = role === 'police' ? 'badge_no' : 'citizen_id';
    const table = role === 'police' ? 'POLICE_OFFICERS' : 'CITIZENS';
    
    let [[user]] = await conn.execute(`SELECT * FROM ${table} WHERE email = ?`, [email]);
    
    if (!user) {
      if (role === 'police') {
        const badgeNo = await createBadgeNo(conn);
        const hash = await bcrypt.hash('google_oauth_dummy', 10);
        await conn.execute(
          'INSERT INTO POLICE_OFFICERS (badge_no, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
          [badgeNo, full_name || 'Google Officer', email, hash, 'Traffic Police']
        );
        [[user]] = await conn.execute('SELECT * FROM POLICE_OFFICERS WHERE badge_no = ?', [badgeNo]);
      } else {
        const hash = await bcrypt.hash('google_oauth_dummy', 10);
        const [result] = await conn.execute(
          'INSERT INTO CITIZENS (full_name, email, password_hash, trust_score) VALUES (?, ?, ?, 100)',
          [full_name || 'Google Citizen', email, hash]
        );
        [[user]] = await conn.execute('SELECT * FROM CITIZENS WHERE citizen_id = ?', [result.insertId]);
      }
    }
    
    const payload = await createAuthPayload(conn, user, role, req);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: 'Google login failed.' });
  } finally {
    if (conn) conn.release();
  }
});

router.post('/citizen/register', async (req, res) => {
  const {
    full_name,
    phone_no,
    password,
    confirm_password,
    plate_no,
    vehicle_type,
    vehicle_model,
    district
  } = req.body;
  const email = normalizeEmail(req.body.email);
  const fullName = String(full_name || '').trim();
  const phoneNo = phone_no ? String(phone_no).trim() : null;
  const plateNo = normalizePlate(plate_no);
  const citizenDistrict = district ? String(district).trim() : 'Chennai';

  if (!fullName || !email || !password || !plateNo || !vehicle_type) {
    return res.status(400).json({
      error: 'full_name, email, password, plate_no, and vehicle_type are required.'
    });
  }

  const passwordError = validatePassword(password, confirm_password);
  if (passwordError) return res.status(400).json({ error: passwordError });

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [[existingCitizen]] = await conn.execute(
      'SELECT citizen_id FROM CITIZENS WHERE email = ?',
      [email]
    );
    if (existingCitizen) {
      await conn.rollback();
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const [[existingVehicle]] = await conn.execute(
      'SELECT plate_no, citizen_id FROM VEHICLES WHERE plate_no = ?',
      [plateNo]
    );
    if (existingVehicle && existingVehicle.citizen_id !== null) {
      await conn.rollback();
      return res.status(409).json({ error: 'Vehicle already registered to an existing account.', plate_no: plateNo });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [citizenResult] = await conn.execute(
      `INSERT INTO CITIZENS (full_name, email, phone_no, password_hash, trust_score, reward_points, account_status, district)
       VALUES (?, ?, ?, ?, 50, 0, 'Active', ?)`,
      [fullName, email, phoneNo, passwordHash, citizenDistrict]
    );

    const citizenId = citizenResult.insertId;
    const [[citizenIdColumn]] = await conn.execute(
      `SHOW COLUMNS FROM VEHICLES LIKE 'citizen_id'`
    );

    if (existingVehicle) {
      // Vehicle exists but citizen_id is null (placeholder from a report). Update it!
      if (citizenIdColumn) {
        await conn.execute(
          `UPDATE VEHICLES SET vehicle_model = ?, vehicle_type = ?, owner_name = ?, citizen_id = ? WHERE plate_no = ?`,
          [vehicle_model || 'Unknown', normalizeVehicleType(vehicle_type), fullName, citizenId, plateNo]
        );
      } else {
        await conn.execute(
          `UPDATE VEHICLES SET vehicle_model = ?, vehicle_type = ?, owner_name = ? WHERE plate_no = ?`,
          [vehicle_model || 'Unknown', normalizeVehicleType(vehicle_type), fullName, plateNo]
        );
      }
    } else {
      // New vehicle
      if (citizenIdColumn) {
        await conn.execute(
          `INSERT INTO VEHICLES (plate_no, vehicle_model, vehicle_type, owner_name, owner_type, citizen_id)
           VALUES (?, ?, ?, ?, 'Individual', ?)`,
          [plateNo, vehicle_model || 'Unknown', normalizeVehicleType(vehicle_type), fullName, citizenId]
        );
      } else {
        await conn.execute(
          `INSERT INTO VEHICLES (plate_no, vehicle_model, vehicle_type, owner_name, owner_type)
           VALUES (?, ?, ?, ?, 'Individual')`,
          [plateNo, vehicle_model || 'Unknown', normalizeVehicleType(vehicle_type), fullName]
        );
      }
    }

    const user = {
      citizen_id: citizenId,
      full_name: fullName,
      email,
      trust_score: 50,
      reward_points: 0
    };
    const payload = await createAuthPayload(conn, user, 'citizen', req);

    await conn.commit();
    res.status(201).json({
      message: 'Registration successful',
      ...payload
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Citizen registration error:', err);
    res.status(500).json({ error: 'Server error during citizen registration.' });
  } finally {
    if (conn) conn.release();
  }
});

router.post('/police/register', async (req, res) => {
  const {
    full_name,
    phone_no,
    password,
    confirm_password,
    officer_rank,
    station_code,
    district
  } = req.body;
  const email = normalizeEmail(req.body.email);
  const fullName = String(full_name || '').trim();
  const phoneNo = phone_no ? String(phone_no).trim() : null;
  const rank = String(officer_rank || '').trim() || 'Constable';
  const station = String(station_code || '').trim() || 'HQ001';
  const policeDistrict = district ? String(district).trim() : 'Chennai';

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'full_name, email, and password are required.' });
  }

  const passwordError = validatePassword(password, confirm_password);
  if (passwordError) return res.status(400).json({ error: passwordError });

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [[existingOfficer]] = await conn.execute(
      'SELECT badge_no FROM POLICE_OFFICERS WHERE email = ?',
      [email]
    );
    if (existingOfficer) {
      await conn.rollback();
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const badgeNo = await createBadgeNo(conn);
    const passwordHash = await bcrypt.hash(password, 12);
    await conn.execute(
      `INSERT INTO POLICE_OFFICERS (badge_no, full_name, email, phone_no, password_hash, officer_rank, station_code, is_active, district)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [badgeNo, fullName, email, phoneNo, passwordHash, rank, station, policeDistrict]
    );

    const user = {
      badge_no: badgeNo,
      full_name: fullName,
      email,
      station_code: station,
      district: policeDistrict
    };
    const payload = await createAuthPayload(conn, user, 'police', req);

    await conn.commit();
    res.status(201).json({
      message: 'Registration successful',
      ...payload
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Police registration error:', err);
    res.status(500).json({ error: 'Server error during police registration.' });
  } finally {
    if (conn) conn.release();
  }
});

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
    } catch (e) {  }
  }
  res.json({ message: 'Logged out successfully.' });
});

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
