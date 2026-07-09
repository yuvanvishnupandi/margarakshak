const express = require('express');
const router = express.Router();

const GEMINI_API_KEY  = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const OPENAI_API_KEY  = process.env.OPENAI_API_KEY || '';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';

// ─── Native Fetch Implementation for AI Providers (No SDKs needed) ──────────

async function analyzeWithOpenAI(base64ImageUrl) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: `You are a strict traffic violation AI. Analyse this image. Return ONLY valid JSON: {"is_valid_submission": true/false, "extracted_plate": "text or empty", "violation_detected": "type or empty", "confidence_score": 0-100, "rejection_reason": "reason or empty"}. Rules: is_valid_submission = true ONLY if there is a clearly visible vehicle AND a readable license plate. If deity/landscape/blurry: false and state rejection reason.` },
          { type: "image_url", image_url: { url: base64ImageUrl } }
        ]
      }],
      max_tokens: 300
    })
  });
  if (!res.ok) throw new Error(`OpenAI error: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function analyzeWithGemini(base64ImageUrl) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
  
  const match = base64ImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) throw new Error("Invalid base64 image");

  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro-vision-latest'];
  let lastError = "";

  for (const model of models) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `You are a strict traffic violation AI. Analyse this image. Return ONLY valid JSON: {"is_valid_submission": true/false, "extracted_plate": "text or empty", "violation_detected": "type or empty", "confidence_score": 0-100, "rejection_reason": "reason or empty"}. Rules: is_valid_submission = true ONLY if there is a clearly visible vehicle AND a readable license plate. If deity/landscape/blurry: false and state rejection reason.` },
            { inline_data: { mime_type: `image/${match[1]}`, data: match[2] } }
          ]
        }]
      })
    });
    if (res.ok) {
      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    } else {
      lastError = await res.text();
    }
  }
  throw new Error(`Gemini failed all models. Last error: ${lastError}`);
}

async function chatWithOpenAI(systemPrompt, userMessage) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 300
    })
  });
  if (!res.ok) throw new Error(`OpenAI error`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function chatWithMistral(systemPrompt, userMessage) {
  if (!MISTRAL_API_KEY) throw new Error("MISTRAL_API_KEY missing");
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MISTRAL_API_KEY}` },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    })
  });
  if (!res.ok) throw new Error(`Mistral error`);
  const data = await res.json();
  return data.choices[0].message.content;
}

function staticFallback(message) {
  return 'I am AskRakshak, your AI assistant for Marga Rakshak. I can help you with challans, traffic rules, violation reports, and vehicle registration.';
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.post('/chat', async (req, res) => {
  try {
    const { message = '', mode = 'citizen', current_path = '' } = req.body;
    let systemPrompt = 'You are AskRakshak, the helpful AI assistant for Marga Rakshak. Be concise, friendly, and helpful.';
    
    let reply = "";
    try {
      reply = await chatWithOpenAI(systemPrompt, message);
    } catch (e1) {
      try {
        reply = await chatWithMistral(systemPrompt, message);
      } catch (e2) {
        reply = staticFallback(message);
      }
    }
    return res.json({ response: reply.trim() });
  } catch (err) {
    return res.json({ response: staticFallback(req.body.message || '') });
  }
});

router.post('/process-evidence', async (req, res) => {
  try {
    const { image_url } = req.body;
    if (!image_url) return res.status(400).json({ error: 'image_url is required' });

    let rawText = "";
    let errors = [];

    // 1. Try Gemini Native
    try {
      rawText = await analyzeWithGemini(image_url);
    } catch (e1) {
      errors.push(e1.message);
      // 2. Try OpenAI Fallback
      try {
        rawText = await analyzeWithOpenAI(image_url);
      } catch (e2) {
        errors.push(e2.message);
        throw new Error(errors.join(" | "));
      }
    }

    const jsonStr = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(jsonStr);

    return res.json({
      status: 'success', is_fraud: false, fraud_reason: '',
      vision_validation: {
        is_valid_submission: parsed.is_valid_submission ?? true,
        extracted_plate:     parsed.extracted_plate     || '',
        violation_detected:  parsed.violation_detected  || '',
        confidence_score:    parsed.confidence_score    ?? 80,
        rejection_reason:    parsed.rejection_reason    || ''
      }, 
      challan: null, jurisdiction_id: 'RTO-TN01'
    });

  } catch (err) {
    return res.json({
      status: 'success', is_fraud: false, fraud_reason: '',
      vision_validation: { is_valid_submission: false, extracted_plate: '', violation_detected: '', confidence_score: 0, rejection_reason: `AI Failed: ${err.message}` },
      challan: null, jurisdiction_id: 'RTO-TN01'
    });
  }
});

module.exports = router;
