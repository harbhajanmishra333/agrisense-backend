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

    // STRICT JSON ENFORCEMENT PROMPT
    const prompt = `
You are an agricultural irrigation expert.
Your job is to give FULL irrigation recommendations based on soil, crop, and moisture.

Return ONLY valid JSON. No text outside JSON. No backticks. No comments. No code blocks.

Input:
Soil Type: ${soil_type}
Crop: ${crop}
Current Soil Moisture: ${moisture}%

Respond in EXACTLY this JSON structure:

{
  "need_irrigation": true or false,
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
  "reason": "<one short sentence>",
  "risk": "<one short sentence>",
  "ai_explanation": [
    "<point 1>",
    "<point 2>",
    "<point 3>",
    "<point 4>",
    "<point 5>"
  ]
}

RULES:
- MUST follow the JSON structure exactly.
- true/false MUST be lowercase.
- No extra keys.
- No trailing commas.
- No human explanation outside the JSON object.
`;

    // API Request
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-oss-20b:free",
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
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
    // --------------------------------------------

    return res.json(jsonData);

  } catch (err) {
    console.log("IRRIGATION ERROR:", err.response?.data || err);
    return res.status(500).json({
      error: "Irrigation prediction failed",
      details: err.response?.data || err.message,
    });
  }
};
