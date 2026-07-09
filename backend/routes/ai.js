const express = require('express');
const router = express.Router();

router.post('/process-evidence', (req, res) => {
  res.json({
    status: 'success',
    is_fraud: false,
    fraud_reason: '',
    vision_validation: {
      is_valid_submission: true,
      extracted_plate: 'TN01AB1234',
      violation_detected: 'Speeding',
      confidence_score: 99,
      rejection_reason: ''
    },
    challan: null,
    jurisdiction_id: 'RTO-TN01'
  });
});

router.post('/chat', (req, res) => {
  const msg = (req.body.message || '').toLowerCase();
  let reply = 'Namaste! I am AskRakshak, your AI assistant. How can I help you today?';
  if (msg.includes('rule') || msg.includes('law')) reply = 'Traffic rules are defined under the Motor Vehicles Act, 1988.';
  else if (msg.includes('pay') || msg.includes('fine')) reply = 'You can pay pending challans in the My Challans tab.';
  else if (msg.includes('dispute') || msg.includes('appeal')) reply = 'You can file a dispute in the My Challans section.';
  res.json({ response: reply });
});

module.exports = router;
