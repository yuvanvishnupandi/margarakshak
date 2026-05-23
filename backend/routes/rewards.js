const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/citizen/rewards/wallet/:citizenId
router.get('/wallet/:citizenId', async (req, res) => {
  const { citizenId } = req.params;
  try {
    const [[citizen]] = await db.execute(
      `SELECT citizen_id, reward_points, wallet_balance,
              (SELECT COUNT(*) FROM REPORTS WHERE citizen_id=? AND status='Verified') AS verified_reports,
              trust_score
       FROM CITIZENS WHERE citizen_id=?`,
      [citizenId, citizenId]
    );
    if (!citizen) return res.status(404).json({ error: 'Citizen not found.' });

    const [catalog] = await db.execute(
      `SELECT reward_id, reward_name, description, points_required,
              icon, requirement_type, requirement_value, is_active
       FROM REWARDS_CATALOG WHERE is_active=1 ORDER BY points_required ASC`
    );

    const [history] = await db.execute(
      `SELECT rh.redemption_id, rh.points_redeemed, rh.wallet_amount,
              rh.conversion_rate, rh.redeemed_at
       FROM REDEMPTION_HISTORY rh
       WHERE rh.citizen_id=? ORDER BY rh.redeemed_at DESC LIMIT 20`,
      [citizenId]
    );

    res.json({
      citizen_id: citizen.citizen_id,
      reward_points: citizen.reward_points || 0,
      wallet_balance: parseFloat(citizen.wallet_balance) || 0,
      trust_score: citizen.trust_score || 0,
      verified_reports: citizen.verified_reports || 0,
      catalog,
      redemption_history: history
    });
  } catch (err) {
    console.error('Rewards wallet error:', err);
    res.status(500).json({ error: 'Failed to load rewards: ' + err.message });
  }
});

// POST /api/citizen/rewards/redeem
router.post('/redeem', async (req, res) => {
  const { citizen_id, points_to_redeem } = req.body;
  if (!citizen_id || !points_to_redeem || points_to_redeem < 10) {
    return res.status(400).json({ error: 'citizen_id and points_to_redeem (min 10) required.' });
  }
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [[citizen]] = await conn.execute(
      `SELECT citizen_id, reward_points, wallet_balance FROM CITIZENS WHERE citizen_id=? FOR UPDATE`,
      [citizen_id]
    );
    if (!citizen) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Citizen not found.' }); }
    if (citizen.reward_points < points_to_redeem) {
      await conn.rollback(); conn.release();
      return res.status(400).json({ error: `Insufficient points. You have ${citizen.reward_points} points.` });
    }

    // Conversion: 10 points = Rs. 50
    const wallet_amount = parseFloat(((points_to_redeem / 10) * 50).toFixed(2));

    await conn.execute(
      `UPDATE CITIZENS SET reward_points = reward_points - ?, wallet_balance = wallet_balance + ? WHERE citizen_id=?`,
      [points_to_redeem, wallet_amount, citizen_id]
    );

    await conn.execute(
      `INSERT INTO REDEMPTION_HISTORY (citizen_id, points_redeemed, wallet_amount, conversion_rate)
       VALUES (?, ?, ?, '10 points = Rs. 50')`,
      [citizen_id, points_to_redeem, wallet_amount]
    );

    // Notify citizen
    try {
      await conn.execute(
        `INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message, is_read)
         VALUES (?, 'General', ?, 0)`,
        [citizen_id, `You redeemed ${points_to_redeem} reward points for Rs. ${wallet_amount} wallet balance!`]
      );
    } catch (ne) { console.warn('Notify skip:', ne.message); }

    await conn.commit();
    conn.release();

    res.json({
      message: `Successfully redeemed ${points_to_redeem} points for Rs. ${wallet_amount}!`,
      points_redeemed: points_to_redeem,
      wallet_amount,
      new_balance: parseFloat(citizen.wallet_balance) + wallet_amount,
      remaining_points: citizen.reward_points - points_to_redeem
    });
  } catch (err) {
    if (conn) { await conn.rollback(); conn.release(); }
    console.error('Redeem error:', err);
    res.status(500).json({ error: 'Redemption failed: ' + err.message });
  }
});

module.exports = router;
