const express = require('express');
const router = express.Router();

// ─── AI Provider Clients ──────────────────────────────────────────────────────
let GoogleGenerativeAI;
try {
  GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
} catch (err) {
  console.error("Failed to load Gemini SDK. AI will use fallback.");
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function tryModels(prompt, imagePart = null) {
  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-2.0-flash-exp',
    'gemini-pro-vision'
  ];

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const payload = imagePart ? [prompt, imagePart] : [prompt];
      const result = await model.generateContent(payload);
      
      const text = result.response.text();
      if (text && text.trim()) return text;
    } catch (err) {
      lastError = err;
      console.warn(`[AI] Model ${modelName} failed:`, err.message);
      // If the model is not found (404), we continue to the next model in the list.
      // If it's a 403 (Invalid API key), we should probably stop, but we'll keep trying just in case.
    }
  }
  
  throw lastError || new Error("All Gemini models failed.");
}

async function chatWithFallback(systemPrompt, userMessage) {
  if (GoogleGenerativeAI && GEMINI_API_KEY) {
    try {
      const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage}\nAskRakshak:`;
      const text = await tryModels(fullPrompt);
      return text.trim();
    } catch (err) {
      console.warn('[AI Chat] All models failed:', err.message);
    }
  }
  return staticFallback(userMessage);
}

async function analyzeEvidenceImage(base64ImageUrl) {
  const match = base64ImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  
  if (!GEMINI_API_KEY) {
    return {
      is_valid_submission: false,
      extracted_plate:     '',
      violation_detected:  '',
      confidence_score:    0,
      rejection_reason:    'API Key missing on server. AI Vision requires GEMINI_API_KEY.'
    };
  }

  if (GoogleGenerativeAI && match) {
    try {
      const prompt = `You are a strict traffic violation AI. Analyse this image.
Return ONLY valid JSON (no markdown, no explanation):
{
  "is_valid_submission": true or false,
  "extracted_plate": "vehicle number plate text or empty string",
  "violation_detected": "violation type or empty string",
  "confidence_score": number from 0 to 100,
  "rejection_reason": "reason if invalid else empty string"
}

Strict Rules:
- is_valid_submission = true ONLY if there is a clearly visible vehicle AND a readable license plate.
- If it is a random photo, a person, a deity, a landscape, blurry, or no plate is visible: is_valid_submission = false and set rejection_reason to "No clear vehicle or license plate detected".
- violation_detected must be one of: Speeding, No Helmet, Triple Riding, No Seatbelt, Signal Jumping, Wrong Lane, Illegal Parking, Mobile Phone Use, Other`;

      const imagePart = {
        inlineData: { data: match[2], mimeType: `image/${match[1]}` }
      };

      const rawText = await tryModels(prompt, imagePart);
      
      const raw = rawText.trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();

      const parsed = JSON.parse(raw);
      return {
        is_valid_submission: parsed.is_valid_submission ?? true,
        extracted_plate:     parsed.extracted_plate     || '',
        violation_detected:  parsed.violation_detected  || '',
        confidence_score:    parsed.confidence_score    ?? 80,
        rejection_reason:    parsed.rejection_reason    || ''
      };
    } catch (err) {
      console.warn('[AI Vision] Gemini vision failed:', err.message);
      return {
        is_valid_submission: false,
        extracted_plate:     '',
        violation_detected:  '',
        confidence_score:    0,
        rejection_reason:    `AI Error: ${err.message}`
      };
    }
  }

  return {
    is_valid_submission: false,
    extracted_plate:     '',
    violation_detected:  '',
    confidence_score:    0,
    rejection_reason:    'Invalid image format.'
  };
}

function staticFallback(message) {
  const msg = (message || '').toLowerCase();
  if (msg.includes('pay') || msg.includes('fine') || msg.includes('challan')) return 'You can view and pay your pending challans from the "My Challans" tab on your dashboard.';
  if (msg.includes('dispute') || msg.includes('wrong') || msg.includes('appeal')) return 'If you believe a challan was issued in error, go to "My Challans" and click the Dispute button to file an appeal.';
  if (msg.includes('rule') || msg.includes('law') || msg.includes('speed')) return 'Traffic rules are governed by the Motor Vehicles Act, 1988. You can review all applicable rules under "Rules & Laws" in the navigation bar.';
  if (msg.includes('report') || msg.includes('submit') || msg.includes('upload')) return 'To submit a violation report, go to "Submit Report", upload your evidence photo, fill in the vehicle number plate, and submit. The AI will analyse the image automatically.';
  if (msg.includes('vehicle') || msg.includes('register')) return 'You can register and manage your vehicles under "My Vehicles" in your citizen dashboard.';
  if (msg.includes('reward') || msg.includes('point') || msg.includes('trust')) return 'You earn Trust Points for every verified report submission. Redeem them for rewards in the Rewards section.';
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey') || msg.includes('namaste')) return 'Namaste! I am AskRakshak, your traffic enforcement AI assistant. How can I help you today?';
  return 'I am AskRakshak, your AI assistant for Marga Rakshak. I can help you with challans, traffic rules, violation reports, and vehicle registration. What would you like to know?';
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.post('/chat', async (req, res) => {
  try {
    const { message = '', mode = 'citizen', current_path = '' } = req.body;
    let systemPrompt = 'You are AskRakshak, the helpful AI assistant for Marga Rakshak, a Tamil Nadu government smart traffic enforcement platform. Be concise, friendly, and helpful. Only answer questions related to traffic rules, challans, violation reports, and vehicle registration.';
    if (mode === 'citizen') {
      if (current_path.toLowerCase().includes('pay')) systemPrompt += ' The user is on the Pay Challan page. Help them with payment queries.';
      else if (current_path.toLowerCase().includes('submit')) systemPrompt += ' The user is submitting a violation report. Remind them to ensure only one vehicle is clearly visible in the frame and GPS location is enabled.';
      else if (current_path.toLowerCase().includes('dispute') || current_path.toLowerCase().includes('challan')) systemPrompt += ' The user may be disputing a challan. Help them understand the appeal process and what details to include.';
    } else if (mode === 'police' || mode === 'officer') {
      systemPrompt = 'You are AskRakshak, an AI assistant for Tamil Nadu Traffic Police Officers using the Marga Rakshak enforcement platform. Help them with verification procedures, enforcement guidelines, and dashboard navigation. Be precise and professional.';
    }
    const reply = await chatWithFallback(systemPrompt, message);
    return res.json({ response: reply });
  } catch (err) {
    return res.json({ response: staticFallback(req.body.message || '') });
  }
});

router.post('/process-evidence', async (req, res) => {
  try {
    const { image_url } = req.body;
    if (!image_url) return res.status(400).json({ error: 'image_url is required' });
    const vision = await analyzeEvidenceImage(image_url);
    return res.json({
      status: 'success', is_fraud: false, fraud_reason: '',
      vision_validation: vision, challan: null, jurisdiction_id: 'RTO-TN01'
    });
  } catch (err) {
    return res.json({
      status: 'success', is_fraud: false, fraud_reason: '',
      vision_validation: { is_valid_submission: false, extracted_plate: '', violation_detected: '', confidence_score: 0, rejection_reason: `Server Error: ${err.message}` },
      challan: null, jurisdiction_id: 'RTO-TN01'
    });
  }
});

module.exports = router;
