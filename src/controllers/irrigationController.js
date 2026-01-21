import axios from "axios";

export const irrigationAdvice = async (req, res) => {
  try {
    const { soil_type, crop, moisture } = req.body;

    // Input validation
    if (!soil_type || !crop || moisture === undefined) {
      return res.status(400).json({
        error: "soil_type, crop, moisture are required",
      });
    }

    // STRICT JSON ENFORCEMENT PROMPT WITH HINDI INSTRUCTIONS
    const prompt = `
You are an agricultural irrigation expert fluent in Hindi (Devanagari).
Your job is to give FULL irrigation recommendations based on soil, crop, and moisture.

Return ONLY valid JSON. No text outside JSON. No backticks. No comments.

Input:
Soil Type: ${soil_type}
Crop: ${crop}
Current Soil Moisture: ${moisture}%

Respond in EXACTLY this JSON structure.
RULES:
1. JSON Keys must be in ENGLISH.
2. Descriptive values (reason, risk, explanation) must be in HINDI.
3. Technical values (mechanisms, numbers) stay in English/Numbers.

REQUIRED JSON SCHEMA:
{
  "need_irrigation": true,
  "recommended_mm": <number>,
  "irrigation_mechanism": "<drip | sprinkler | flood | furrow | micro-sprinkler>",
  "frequency_days": <number>, 
  "duration_minutes": <number>,
  "moisture_thresholds": {
    "ideal_range": "<min-max %>",
    "stress_below": <number>,
    "excess_above": <number>
  },
  "soil_behavior": {
    "infiltration_rate": "<slow | medium | fast>",
    "water_holding_capacity": "<low | medium | high>",
    "runoff_risk": "<low | medium | high>"
  },
  "reason": "<One short technical sentence in HINDI explaining why>",
  "risk": "<One short sentence in HINDI about risks of current moisture>",
  "ai_explanation": [
    "<Practical Tip 1 in HINDI>",
    "<Practical Tip 2 in HINDI>",
    "<Practical Tip 3 in HINDI>",
    "<Practical Tip 4 in HINDI>",
    "<Practical Tip 5 in HINDI>"
  ]
}
`;

    // API Request
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        // Using Mistral 7B as it handles Hindi + JSON better than GPT-OSS
        model: "mistralai/mistral-7b-instruct", 
        temperature: 0.2,
        messages: [
            { role: "system", content: "You are an Agronomy API. Output JSON only." },
            { role: "user", content: prompt }
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let output = response.data.choices[0].message.content.trim();

    // ---------- JSON RECOVERY FALLBACK ----------
    let jsonData = null;

    try {
      jsonData = JSON.parse(output); // FIRST attempt
    } catch (error) {
      const match = output.match(/\{[\s\S]*\}/); // extract closest JSON block
      if (match) {
        try {
          jsonData = JSON.parse(match[0]); // SECOND attempt
        } catch (err2) {
          console.log("JSON PARSE FAIL:", err2);
        }
      }
    }

    // If STILL invalid → return raw text for debugging
    if (!jsonData) {
      return res.status(500).json({
        error: "Model returned invalid JSON",
        raw: output,
      });
    }

    // Return the Hindi-Localized Data
    return res.json(jsonData);

  } catch (err) {
    console.log("IRRIGATION ERROR:", err.response?.data || err);
    return res.status(500).json({
      error: "Irrigation prediction failed",
      details: err.response?.data || err.message,
    });
  }
};