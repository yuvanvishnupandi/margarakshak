const express = require('express');
const router = express.Router();

const GEMINI_API_KEY  = process.env.GEMINI_API_KEY  || process.env.GOOGLE_API_KEY || '';
const OPENAI_API_KEY  = process.env.OPENAI_API_KEY  || '';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';

// ─── Gemini Vision (Image Analysis) ──────────────────────────────────────────

async function analyzeWithGemini(base64ImageUrl) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
  const match = base64ImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) throw new Error('Invalid base64 image format');

  const prompt = `You are a traffic violation AI for Tamil Nadu, India. Your job is to analyse the given image strictly.

IMPORTANT: You must return ONLY valid JSON with no markdown, no backticks, no explanation whatsoever. Just the raw JSON object.

Required JSON structure:
{"is_valid_submission":true,"extracted_plate":"","violation_detected":"","confidence_score":0,"rejection_reason":""}

STRICT REJECTION RULES — set is_valid_submission=false if ANY of these are true:
- The image shows a person, human face, deity, god, religious figure, or statue
- The image shows a landscape, building, road without a vehicle, or random scene
- The image is blurry, dark, or no vehicle is clearly visible
- No license plate is visible in the image
- The image is a screenshot, meme, or text document

ACCEPTANCE RULES — set is_valid_submission=true ONLY if:
- A motor vehicle (car, bus, truck, motorcycle, auto-rickshaw) is clearly visible
- A Tamil Nadu license plate or any Indian license plate is present in the image

PLATE EXTRACTION — if is_valid_submission=true:
- extracted_plate: extract the EXACT text on the Indian license plate (e.g. "TN 01 AB 1234"). Use spaces between groups.
- violation_detected: one of [Speeding, No Helmet, Triple Riding, No Seatbelt, Signal Jumping, Wrong Lane, Illegal Parking, Mobile Phone Use, Other]
- confidence_score: 0-100 based on image clarity
- rejection_reason: empty string ""

If is_valid_submission=false:
- extracted_plate: ""
- violation_detected: ""
- confidence_score: 0
- rejection_reason: brief explanation why rejected`;

  // Try multiple model/api-version combinations
  const attempts = [
    { api: 'v1beta', model: 'gemini-1.5-flash' },
    { api: 'v1',     model: 'gemini-1.5-flash' },
    { api: 'v1beta', model: 'gemini-2.0-flash' },
    { api: 'v1',     model: 'gemini-2.0-flash' },
    { api: 'v1beta', model: 'gemini-1.5-pro' },
    { api: 'v1',     model: 'gemini-1.5-pro' },
    { api: 'v1beta', model: 'gemini-pro-vision' },
    { api: 'v1',     model: 'gemini-pro-vision' },
  ];

  let lastError = '';
  for (const { api, model } of attempts) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inline_data: { mime_type: `image/${match[1]}`, data: match[2] } }
              ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
          })
        }
      );
      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = rawText.trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/,'').trim();
        return JSON.parse(cleaned);
      }
      const errBody = await res.text();
      lastError = `${model}@${api}: ${errBody.substring(0,100)}`;
    } catch (e) {
      lastError = e.message;
    }
  }
  throw new Error(`Gemini vision failed all models. Last: ${lastError}`);
}

// ─── OpenAI Vision (Fallback) ─────────────────────────────────────────────────

async function analyzeWithOpenAI(base64ImageUrl) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'You are a strict traffic violation AI. Analyse this image. Return ONLY valid JSON: {"is_valid_submission":true/false,"extracted_plate":"text or empty","violation_detected":"type or empty","confidence_score":0-100,"rejection_reason":"reason or empty"}. is_valid_submission=true ONLY if there is a clearly visible vehicle AND readable license plate. Random photos/deities/landscapes: false.' },
          { type: 'image_url', image_url: { url: base64ImageUrl } }
        ]
      }],
      max_tokens: 300
    })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI error: ${body.substring(0,150)}`);
  }
  const data = await res.json();
  const rawText = data.choices[0].message.content;
  const cleaned = rawText.trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/,'').trim();
  return JSON.parse(cleaned);
}

// ─── Text Chat Functions ──────────────────────────────────────────────────────

async function chatWithGemini(systemPrompt, userMessage) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
  const attempts = [
    { api: 'v1beta', model: 'gemini-1.5-flash' },
    { api: 'v1',     model: 'gemini-1.5-flash' },
    { api: 'v1beta', model: 'gemini-2.0-flash' },
    { api: 'v1',     model: 'gemini-2.0-flash' },
    { api: 'v1beta', model: 'gemini-1.5-pro' },
  ];
  let lastError = '';
  for (const { api, model } of attempts) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}\nAskRakshak:` }] }] })
        }
      );
      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
      lastError = await res.text();
    } catch (e) { lastError = e.message; }
  }
  throw new Error(`Gemini chat failed: ${lastError.substring(0,100)}`);
}

async function chatWithMistral(systemPrompt, userMessage) {
  if (!MISTRAL_API_KEY) throw new Error('MISTRAL_API_KEY not set');
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MISTRAL_API_KEY}` },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    })
  });
  if (!res.ok) throw new Error('Mistral chat failed');
  const data = await res.json();
  return data.choices[0].message.content;
}

async function chatWithOpenAI(systemPrompt, userMessage) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 300
    })
  });
  if (!res.ok) throw new Error('OpenAI chat failed');
  const data = await res.json();
  return data.choices[0].message.content;
}

function staticFallback(message) {
  const m = (message || '').toLowerCase();
  if (m.includes('pay') || m.includes('challan') || m.includes('fine')) return 'You can view and pay your pending challans from the "My Challans" tab on your dashboard.';
  if (m.includes('dispute') || m.includes('appeal')) return 'If you believe a challan was issued in error, go to "My Challans" and click Dispute to file an appeal.';
  if (m.includes('rule') || m.includes('law') || m.includes('speed')) return 'Traffic rules are governed by the Motor Vehicles Act, 1988. Check "Rules & Laws" in the navigation bar.';
  if (m.includes('report') || m.includes('submit') || m.includes('upload')) return 'To submit a violation report, go to "Submit Report", upload a clear evidence photo showing the vehicle and plate, and submit.';
  if (m.includes('vehicle') || m.includes('register')) return 'You can register and manage your vehicles under "My Vehicles" in your citizen dashboard.';
  if (m.includes('hi') || m.includes('hello') || m.includes('hey') || m.includes('namaste')) return 'Namaste! I am AskRakshak, your traffic enforcement AI assistant. How can I help you today?';
  return 'I am AskRakshak, your AI assistant for Marga Rakshak. I can help you with challans, traffic rules, violation reports, and vehicle registration.';
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.post('/chat', async (req, res) => {
  try {
    const { message = '', mode = 'citizen' } = req.body;
    let systemPrompt = 'You are AskRakshak, a helpful, concise AI assistant for Marga Rakshak, a Tamil Nadu government smart traffic enforcement platform. Only answer questions about traffic rules, challans, violation reports, and vehicle registration.';
    if (mode === 'police' || mode === 'officer') {
      systemPrompt = 'You are AskRakshak, an AI assistant for Tamil Nadu Traffic Police Officers. Help them with verification procedures, enforcement guidelines, and dashboard navigation. Be precise and professional.';
    }

    let reply = '';
    // Gemini → Mistral → OpenAI → static fallback
    try { reply = await chatWithGemini(systemPrompt, message); }
    catch (e1) {
      try { reply = await chatWithMistral(systemPrompt, message); }
      catch (e2) {
        try { reply = await chatWithOpenAI(systemPrompt, message); }
        catch (e3) { reply = staticFallback(message); }
      }
    }
    return res.json({ response: reply.trim() || staticFallback(message) });
  } catch (err) {
    return res.json({ response: staticFallback(req.body.message || '') });
  }
});

router.post('/process-evidence', async (req, res) => {
  try {
    const { image_url } = req.body;
    if (!image_url) return res.status(400).json({ error: 'image_url is required' });

    let vision = null;
    let visionError = '';

    // Gemini → OpenAI → accept gracefully
    try {
      vision = await analyzeWithGemini(image_url);
    } catch (e1) {
      visionError = e1.message;
      try {
        vision = await analyzeWithOpenAI(image_url);
      } catch (e2) {
        visionError += ' | ' + e2.message;
        console.error("AI Vision completely failed:", visionError);
        // STRICT MODE: Do not accept images if AI is completely down or failing.
        return res.status(500).json({ error: `AI Verification Failed. Please check your API keys or try again later. Details: ${visionError}` });
      }
    }

    return res.json({
      status: 'success',
      is_fraud: false,
      fraud_reason: '',
      vision_validation: {
        is_valid_submission: vision.is_valid_submission ?? true,
        extracted_plate:     vision.extracted_plate     || '',
        violation_detected:  vision.violation_detected  || '',
        confidence_score:    vision.confidence_score    ?? 80,
        rejection_reason:    vision.rejection_reason    || ''
      },
      challan: null,
      jurisdiction_id: 'RTO-TN01'
    });

  } catch (err) {
    // Ultimate fallback — never block the user
    return res.json({
      status: 'success',
      is_fraud: false,
      fraud_reason: '',
      vision_validation: {
        is_valid_submission: true,
        extracted_plate: '',
        violation_detected: '',
        confidence_score: 50,
        rejection_reason: ''
      },
      challan: null,
      jurisdiction_id: 'RTO-TN01'
    });
  }
});

module.exports = router;
