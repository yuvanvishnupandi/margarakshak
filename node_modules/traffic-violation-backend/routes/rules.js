const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    
    let hasCategory = false;
    try {
      await db.execute(`SELECT category FROM VIOLATION_RULES LIMIT 1`);
      hasCategory = true;
    } catch (_) { hasCategory = false; }

    const selectCategory = hasCategory
      ? `COALESCE(category,
           CASE
             WHEN rule_name LIKE '%Speed%' OR rule_name LIKE '%Racing%'            THEN 'Speeding'
             WHEN rule_name LIKE '%Drunk%' OR rule_name LIKE '%DUI%' OR rule_name LIKE '%Alcohol%' OR rule_code LIKE '%185%' OR rule_code LIKE '%184%' THEN 'DUI'
             WHEN rule_name LIKE '%Helmet%' OR rule_name LIKE '%Seat Belt%' OR rule_name LIKE '%Mobile%' OR rule_name LIKE '%Emergency%' OR rule_name LIKE '%Signal%' OR rule_name LIKE '%Lane%' OR rule_name LIKE '%Red Light%' OR rule_name LIKE '%Wrong%' OR rule_name LIKE '%Child%' OR rule_name LIKE '%School Bus%' OR rule_name LIKE '%Accident%' OR rule_name LIKE '%Footwear%' OR rule_name LIKE '%High Beam%' OR rule_name LIKE '%Indicator%' OR rule_name LIKE '%Noise%' OR rule_name LIKE '%Traffic Officer%' OR rule_name LIKE '%Stop%' THEN 'Safety'
             WHEN rule_name LIKE '%Licence%' OR rule_name LIKE '%License%' OR rule_name LIKE '%Insurance%' OR rule_name LIKE '%Registr%' OR rule_name LIKE '%PUC%' OR rule_name LIKE '%Fitness%' OR rule_name LIKE '%Suspended%' OR rule_name LIKE '%Unlicensed%' OR rule_name LIKE '%Authority%' OR rule_name LIKE '%Consent%' OR rule_name LIKE '%Plate%' OR rule_name LIKE '%Minor%' OR rule_name LIKE '%Tamper%' THEN 'Documents'
             WHEN rule_name LIKE '%Parking%' OR rule_name LIKE '%Dangerous Position%'                    THEN 'Parking'
             WHEN rule_name LIKE '%Overload%'                                                             THEN 'Overloading'
             WHEN rule_name LIKE '%Exhaust%' OR rule_name LIKE '%Lights%' OR rule_name LIKE '%Reflector%' OR rule_name LIKE '%Modification%' OR rule_name LIKE '%Horn%' OR rule_name LIKE '%Tinted%' OR rule_name LIKE '%Unsafe Condition%' OR rule_name LIKE '%Pollution%' THEN 'Equipment'
             ELSE 'Safety'
           END
         ) AS category`
      : `CASE
           WHEN rule_name LIKE '%Speed%' OR rule_name LIKE '%Racing%'            THEN 'Speeding'
           WHEN rule_name LIKE '%Drunk%' OR rule_name LIKE '%DUI%' OR rule_name LIKE '%Alcohol%' OR rule_code LIKE '%185%' OR rule_code LIKE '%184%' THEN 'DUI'
           WHEN rule_name LIKE '%Helmet%' OR rule_name LIKE '%Seat Belt%' OR rule_name LIKE '%Mobile%' OR rule_name LIKE '%Emergency%' OR rule_name LIKE '%Signal%' OR rule_name LIKE '%Lane%' OR rule_name LIKE '%Red Light%' OR rule_name LIKE '%Wrong%' OR rule_name LIKE '%Child%' OR rule_name LIKE '%School Bus%' OR rule_name LIKE '%Accident%' OR rule_name LIKE '%Footwear%' OR rule_name LIKE '%High Beam%' OR rule_name LIKE '%Indicator%' OR rule_name LIKE '%Noise%' OR rule_name LIKE '%Traffic Officer%' OR rule_name LIKE '%Stop%' THEN 'Safety'
           WHEN rule_name LIKE '%Licence%' OR rule_name LIKE '%License%' OR rule_name LIKE '%Insurance%' OR rule_name LIKE '%Registr%' OR rule_name LIKE '%PUC%' OR rule_name LIKE '%Fitness%' OR rule_name LIKE '%Suspended%' OR rule_name LIKE '%Unlicensed%' OR rule_name LIKE '%Authority%' OR rule_name LIKE '%Consent%' OR rule_name LIKE '%Plate%' OR rule_name LIKE '%Minor%' OR rule_name LIKE '%Tamper%' THEN 'Documents'
           WHEN rule_name LIKE '%Parking%' OR rule_name LIKE '%Dangerous Position%'                    THEN 'Parking'
           WHEN rule_name LIKE '%Overload%'                                                             THEN 'Overloading'
           WHEN rule_name LIKE '%Exhaust%' OR rule_name LIKE '%Lights%' OR rule_name LIKE '%Reflector%' OR rule_name LIKE '%Modification%' OR rule_name LIKE '%Horn%' OR rule_name LIKE '%Tinted%' OR rule_name LIKE '%Unsafe Condition%' OR rule_name LIKE '%Pollution%' THEN 'Equipment'
           ELSE 'Safety'
         END AS category`;

    const [rows] = await db.execute(
      `SELECT rule_id, rule_code, rule_name, description, base_fine_amount,
              severity, violation_time, is_active, ${selectCategory}
       FROM VIOLATION_RULES ORDER BY rule_code ASC`
    );
    res.json({ success: true, rules: rows, count: rows.length });
  } catch (err) {
    console.error('Rules fetch error:', err);
    res.status(500).json({ success: false, rules: [], error: err.message });
  }
});

router.post('/create', async (req, res) => {
  const { rule_code, rule_name, description, base_fine_amount, severity, violation_time } = req.body;
  if (!rule_code || !rule_name || !base_fine_amount || !severity) {
    return res.status(400).json({ error: 'rule_code, rule_name, base_fine_amount, severity required.' });
  }
  try {
    
    const [[exists]] = await db.execute(`SELECT rule_id FROM VIOLATION_RULES WHERE rule_code=?`, [rule_code]);
    if (exists) return res.status(400).json({ error: `Rule code '${rule_code}' already exists.` });
    const [result] = await db.execute(
      `INSERT INTO VIOLATION_RULES (rule_code, rule_name, description, base_fine_amount, severity, violation_time, is_active)
       VALUES (?,?,?,?,?,?,1)`,
      [rule_code, rule_name, description || '', parseFloat(base_fine_amount), severity, violation_time || 'Anytime']
    );
    res.status(201).json({ success: true, message: 'Rule created.', rule_id: result.insertId });
  } catch (err) {
    console.error('Create rule error:', err);
    res.status(500).json({ success: false, error: 'Failed to create rule: ' + err.message });
  }
});

router.put('/:ruleId', async (req, res) => {
  const { ruleId } = req.params;
  const { base_fine_amount, rule_name, description, severity, violation_time, is_active } = req.body;
  try {
    const fields = [];
    const vals = [];
    if (base_fine_amount !== undefined) { fields.push('base_fine_amount=?'); vals.push(parseFloat(base_fine_amount)); }
    if (rule_name !== undefined)        { fields.push('rule_name=?'); vals.push(rule_name); }
    if (description !== undefined)      { fields.push('description=?'); vals.push(description); }
    if (severity !== undefined)         { fields.push('severity=?'); vals.push(severity); }
    if (violation_time !== undefined)   { fields.push('violation_time=?'); vals.push(violation_time); }
    if (is_active !== undefined)        { fields.push('is_active=?'); vals.push(is_active ? 1 : 0); }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update.' });
    vals.push(ruleId);
    await db.execute(`UPDATE VIOLATION_RULES SET ${fields.join(',')} WHERE rule_id=?`, vals);
    res.json({ success: true, message: 'Rule updated.' });
  } catch (err) {
    console.error('Update rule error:', err);
    res.status(500).json({ success: false, error: 'Failed to update rule: ' + err.message });
  }
});

router.delete('/:ruleId', async (req, res) => {
  const { ruleId } = req.params;
  try {
    const [result] = await db.execute(`DELETE FROM VIOLATION_RULES WHERE rule_id=?`, [ruleId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Rule not found.' });
    res.json({ success: true, message: 'Rule deleted.' });
  } catch (err) {
    console.error('Delete rule error:', err);
    res.status(500).json({ success: false, error: 'Cannot delete — may be referenced by existing challans.' });
  }
});

module.exports = router;
