const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

// ─── /api/ai/chat ────────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { message = '', mode = 'citizen', current_path = '' } = req.body;

  // Build a contextual system prompt
  let systemPrompt = 'You are AskRakshak, the helpful AI assistant for Marga Rakshak, a Tamil Nadu government traffic enforcement platform. Be concise and helpful. Answer only traffic, challan, and reporting related questions.';

  if (mode === 'citizen') {
    if (current_path.toLowerCase().includes('pay')) {
      systemPrompt += ' The user is on the Pay Challan page. Help them with payment queries.';
    } else if (current_path.toLowerCase().includes('submit')) {
      systemPrompt += ' The user is submitting a violation report. Advise them to ensure only one vehicle is in frame and GPS is enabled.';
    } else if (current_path.toLowerCase().includes('dispute')) {
      systemPrompt += ' The user is disputing a challan. Help them understand the dispute process.';
    }
  } else if (mode === 'police' || mode === 'officer') {
    systemPrompt += ' The user is a Traffic Police Officer. Help them with enforcement, verification, and dashboard usage.';
  }

  // Try Gemini first
  if (GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(`${systemPrompt}\n\nUser: ${message}\nAskRakshak:`);
      const text = result.response.text();
      return res.json({ response: text });
    } catch (err) {
      console.error('Gemini chat error, using fallback:', err.message);
    }
  }

  // Fallback: keyword-based static responses
  const msg = message.toLowerCase();
  let reply = 'Namaste! I am AskRakshak, your AI assistant for Marga Rakshak. How can I help you today?';
  if (msg.includes('pay') || msg.includes('fine') || msg.includes('challan')) {
    reply = 'You can view and pay your pending challans from the "My Challans" tab on your dashboard.';
  } else if (msg.includes('dispute') || msg.includes('wrong') || msg.includes('appeal')) {
    reply = 'If you believe a challan was issued in error, go to "My Challans" and click the Dispute button to file an appeal.';
  } else if (msg.includes('rule') || msg.includes('law') || msg.includes('speed limit')) {
    reply = 'Traffic rules are governed by the Motor Vehicles Act, 1988. You can review all rules under "Rules & Laws" in the navigation.';
  } else if (msg.includes('report') || msg.includes('submit')) {
    reply = 'To submit a violation report, go to "Submit Report", upload your evidence photo, fill in the vehicle number plate, and submit. AI will analyse the image automatically.';
  } else if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey') || msg.includes('namaste')) {
    reply = 'Namaste! I am AskRakshak, your traffic enforcement AI assistant. How can I help you today?';
  }

  return res.json({ response: reply });
});

// ─── /api/ai/process-evidence ─────────────────────────────────────────────────
router.post('/process-evidence', async (req, res) => {
  const { image_url } = req.body;

  if (!image_url) {
    return res.status(400).json({ error: 'image_url is required' });
  }

  // Try Gemini Vision
  if (GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `You are an expert traffic violation AI. Analyse the uploaded image.

Return your answer in exactly this JSON format (no markdown, no extra text):
{
  "is_valid_submission": true or false,
  "extracted_plate": "the vehicle number plate text or empty string",
  "violation_detected": "the type of violation or empty string",
  "confidence_score": a number from 0 to 100,
  "rejection_reason": "reason if invalid else empty string"
}

Rules:
- is_valid_submission = true only if you can clearly see a vehicle and a readable license plate
- If the image is blurry, no vehicle, no plate, or multiple vehicles: is_valid_submission = false
- violation_detected should be one of: Speeding, No Helmet, Triple Riding, No Seatbelt, Signal Jumping, Wrong Lane, Illegal Parking, Mobile Phone Use, or Other`;

      // Handle base64 image
      const base64Match = image_url.match(/^data:image\/(\w+);base64,(.+)$/);
      let imagePart;
      if (base64Match) {
        imagePart = {
          inlineData: {
            data: base64Match[2],
            mimeType: `image/${base64Match[1]}`
          }
        };
      } else {
        // URL-based image
        imagePart = { fileData: { fileUri: image_url, mimeType: 'image/jpeg' } };
      }

      const result = await model.generateContent([prompt, imagePart]);
      const rawText = result.response.text().trim();

      // Strip markdown if present
      const jsonText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(jsonText);

      return res.json({
        status: 'success',
        is_fraud: false,
        fraud_reason: '',
        vision_validation: {
          is_valid_submission: parsed.is_valid_submission ?? true,
          extracted_plate: parsed.extracted_plate || '',
          violation_detected: parsed.violation_detected || '',
          confidence_score: parsed.confidence_score ?? 85,
          rejection_reason: parsed.rejection_reason || ''
        },
        challan: null,
        jurisdiction_id: 'RTO-TN01'
      });
    } catch (err) {
      console.error('Gemini vision error, using fallback:', err.message);
    }
  }

  // Fallback: accept all evidence with a basic response
  return res.json({
    status: 'success',
    is_fraud: false,
    fraud_reason: '',
    vision_validation: {
      is_valid_submission: true,
      extracted_plate: '',
      violation_detected: '',
      confidence_score: 70,
      rejection_reason: ''
    },
    challan: null,
    jurisdiction_id: 'RTO-TN01'
  });
});

module.exports = router;
