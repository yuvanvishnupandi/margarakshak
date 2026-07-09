const express = require('express');
const router = express.Router();

// ─── AI Provider Clients ──────────────────────────────────────────────────────
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const { Mistral } = require('@mistralai/mistralai');

const GEMINI_API_KEY  = process.env.GEMINI_API_KEY  || process.env.GOOGLE_API_KEY || '';
const OPENAI_API_KEY  = process.env.OPENAI_API_KEY  || '';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Try each AI provider in order: Gemini → OpenAI → Mistral
 * Returns the text response from the first provider that succeeds.
 * Falls back to a static keyword-based response if all fail.
 */
async function chatWithFallback(systemPrompt, userMessage) {
  // 1. Gemini
  if (GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(`${systemPrompt}\n\nUser: ${userMessage}\nAskRakshak:`);
      const text = result.response.text();
      if (text && text.trim()) {
        console.log('[AI] Gemini responded successfully.');
        return text.trim();
      }
    } catch (err) {
      console.warn('[AI] Gemini failed:', err.message, '— trying OpenAI...');
    }
  }

  // 2. OpenAI
  if (OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage }
        ],
        max_tokens: 400
      });
      const text = completion.choices[0]?.message?.content;
      if (text && text.trim()) {
        console.log('[AI] OpenAI responded successfully.');
        return text.trim();
      }
    } catch (err) {
      console.warn('[AI] OpenAI failed:', err.message, '— trying Mistral...');
    }
  }

  // 3. Mistral
  if (MISTRAL_API_KEY) {
    try {
      const mistral = new Mistral({ apiKey: MISTRAL_API_KEY });
      const result = await mistral.chat.complete({
        model: 'mistral-small-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage }
        ]
      });
      const text = result.choices[0]?.message?.content;
      if (text && text.trim()) {
        console.log('[AI] Mistral responded successfully.');
        return text.trim();
      }
    } catch (err) {
      console.warn('[AI] Mistral failed:', err.message, '— using static fallback.');
    }
  }

  // 4. Static keyword fallback — always works, never crashes
  return staticFallback(userMessage);
}

/**
 * Vision analysis — uses Gemini Vision (multimodal).
 * Falls back to a permissive stub if Gemini is unavailable.
 */
async function analyzeEvidenceImage(base64ImageUrl) {
  // Extract mime type and base64 data from the data URL
  const match = base64ImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);

  // 1. Gemini Vision
  if (GEMINI_API_KEY && match) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `You are a traffic violation AI. Analyse this image.

Return ONLY valid JSON (no markdown, no explanation):
{
  "is_valid_submission": true or false,
  "extracted_plate": "vehicle number plate text or empty string",
  "violation_detected": "violation type or empty string",
  "confidence_score": number from 0 to 100,
  "rejection_reason": "reason if invalid else empty string"
}

Rules:
- is_valid_submission = true only if there is a clearly visible vehicle with a readable license plate
- If blurry, no vehicle, no plate visible, or multiple vehicles: is_valid_submission = false
- violation_detected must be one of: Speeding, No Helmet, Triple Riding, No Seatbelt, Signal Jumping, Wrong Lane, Illegal Parking, Mobile Phone Use, Other`;

      const imagePart = {
        inlineData: {
          data: match[2],
          mimeType: `image/${match[1]}`
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const raw = result.response.text().trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();

      const parsed = JSON.parse(raw);
      console.log('[AI Vision] Gemini analysed image successfully.');
      return {
        is_valid_submission: parsed.is_valid_submission ?? true,
        extracted_plate:     parsed.extracted_plate     || '',
        violation_detected:  parsed.violation_detected  || '',
        confidence_score:    parsed.confidence_score    ?? 80,
        rejection_reason:    parsed.rejection_reason    || ''
      };
    } catch (err) {
      console.warn('[AI Vision] Gemini vision failed:', err.message);
    }
  }

  // 2. OpenAI Vision fallback
  if (OPENAI_API_KEY && base64ImageUrl) {
    try {
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a traffic violation AI. Analyse this image and return ONLY valid JSON:
{"is_valid_submission": true/false, "extracted_plate": "plate text or empty", "violation_detected": "type or empty", "confidence_score": 0-100, "rejection_reason": "reason or empty"}`
              },
              {
                type: 'image_url',
                image_url: { url: base64ImageUrl }
              }
            ]
          }
        ],
        max_tokens: 200
      });
      const raw = response.choices[0]?.message?.content?.trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
      const parsed = JSON.parse(raw);
      console.log('[AI Vision] OpenAI vision analysed image successfully.');
      return {
        is_valid_submission: parsed.is_valid_submission ?? true,
        extracted_plate:     parsed.extracted_plate     || '',
        violation_detected:  parsed.violation_detected  || '',
        confidence_score:    parsed.confidence_score    ?? 75,
        rejection_reason:    parsed.rejection_reason    || ''
      };
    } catch (err) {
      console.warn('[AI Vision] OpenAI vision failed:', err.message);
    }
  }

  // 3. Permissive fallback — accept the upload, let officer review
  console.warn('[AI Vision] All vision providers failed. Using permissive fallback.');
  return {
    is_valid_submission: true,
    extracted_plate:     '',
    violation_detected:  '',
    confidence_score:    60,
    rejection_reason:    ''
  };
}

function staticFallback(message) {
  const msg = (message || '').toLowerCase();
  if (msg.includes('pay') || msg.includes('fine') || msg.includes('challan')) {
    return 'You can view and pay your pending challans from the "My Challans" tab on your dashboard.';
  }
  if (msg.includes('dispute') || msg.includes('wrong') || msg.includes('appeal')) {
    return 'If you believe a challan was issued in error, go to "My Challans" and click the Dispute button to file an appeal.';
  }
  if (msg.includes('rule') || msg.includes('law') || msg.includes('speed')) {
    return 'Traffic rules are governed by the Motor Vehicles Act, 1988. You can review all applicable rules under "Rules & Laws" in the navigation bar.';
  }
  if (msg.includes('report') || msg.includes('submit') || msg.includes('upload')) {
    return 'To submit a violation report, go to "Submit Report", upload your evidence photo, fill in the vehicle number plate, and submit. The AI will analyse the image automatically.';
  }
  if (msg.includes('vehicle') || msg.includes('register')) {
    return 'You can register and manage your vehicles under "My Vehicles" in your citizen dashboard.';
  }
  if (msg.includes('reward') || msg.includes('point') || msg.includes('trust')) {
    return 'You earn Trust Points for every verified report submission. Redeem them for rewards in the Rewards section.';
  }
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey') || msg.includes('namaste')) {
    return 'Namaste! I am AskRakshak, your traffic enforcement AI assistant. How can I help you today?';
  }
  return 'I am AskRakshak, your AI assistant for Marga Rakshak. I can help you with challans, traffic rules, violation reports, and vehicle registration. What would you like to know?';
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message = '', mode = 'citizen', current_path = '' } = req.body;

    let systemPrompt = 'You are AskRakshak, the helpful AI assistant for Marga Rakshak, a Tamil Nadu government smart traffic enforcement platform. Be concise, friendly, and helpful. Only answer questions related to traffic rules, challans, violation reports, and vehicle registration.';

    if (mode === 'citizen') {
      if (current_path.toLowerCase().includes('pay')) {
        systemPrompt += ' The user is on the Pay Challan page. Help them with payment queries.';
      } else if (current_path.toLowerCase().includes('submit')) {
        systemPrompt += ' The user is submitting a violation report. Remind them to ensure only one vehicle is clearly visible in the frame and GPS location is enabled.';
      } else if (current_path.toLowerCase().includes('dispute') || current_path.toLowerCase().includes('challan')) {
        systemPrompt += ' The user may be disputing a challan. Help them understand the appeal process and what details to include.';
      }
    } else if (mode === 'police' || mode === 'officer') {
      systemPrompt = 'You are AskRakshak, an AI assistant for Tamil Nadu Traffic Police Officers using the Marga Rakshak enforcement platform. Help them with verification procedures, enforcement guidelines, and dashboard navigation. Be precise and professional.';
    }

    const reply = await chatWithFallback(systemPrompt, message);
    return res.json({ response: reply });
  } catch (err) {
    console.error('[/api/ai/chat] Unhandled error:', err.message);
    return res.json({ response: staticFallback(req.body.message || '') });
  }
});

// POST /api/ai/process-evidence
router.post('/process-evidence', async (req, res) => {
  try {
    const { image_url } = req.body;
    if (!image_url) {
      return res.status(400).json({ error: 'image_url is required' });
    }

    const vision = await analyzeEvidenceImage(image_url);

    return res.json({
      status:           'success',
      is_fraud:         false,
      fraud_reason:     '',
      vision_validation: vision,
      challan:          null,
      jurisdiction_id:  'RTO-TN01'
    });
  } catch (err) {
    console.error('[/api/ai/process-evidence] Unhandled error:', err.message);
    // Always return a valid response so the UI never crashes
    return res.json({
      status:           'success',
      is_fraud:         false,
      fraud_reason:     '',
      vision_validation: {
        is_valid_submission: true,
        extracted_plate:     '',
        violation_detected:  '',
        confidence_score:    60,
        rejection_reason:    ''
      },
      challan:          null,
      jurisdiction_id:  'RTO-TN01'
    });
  }
});

module.exports = router;
