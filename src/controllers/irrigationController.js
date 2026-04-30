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

    // STRICT JSON ENFORCEMENT PROMPT WITH ENGLISH INSTRUCTIONS
    const prompt = `
You are an agricultural irrigation expert.
Your job is to give FULL irrigation recommendations based on soil, crop, and moisture.

Return ONLY valid JSON. No text outside JSON. No backticks. No comments.

Input:
Soil Type: ${soil_type}
Crop: ${crop}
Current Soil Moisture: ${moisture}%

Respond in EXACTLY this JSON structure.
RULES:
1. JSON Keys must be in ENGLISH.
2. Descriptive values (reason, risk, explanation) must be in ENGLISH.
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
  "reason": "<One short technical sentence in ENGLISH explaining why>",
  "risk": "<One short sentence in ENGLISH about risks of current moisture>",
  "ai_explanation": [
    "<Practical Tip 1 in ENGLISH>",
    "<Practical Tip 2 in ENGLISH>",
    "<Practical Tip 3 in ENGLISH>",
    "<Practical Tip 4 in ENGLISH>",
    "<Practical Tip 5 in ENGLISH>"
  ]
}
`;

    // API Request
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("[ERROR] OPENROUTER_API_KEY is not set in environment variables.");
    }

    const { data } = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        // Using a model highly optimized for strict JSON output
        model: "openai/gpt-oss-120b:free",
        temperature: 0.2,
        max_tokens: 1500,
        messages: [
          {
            role: "system",
            content:
              "You are an Agronomy API. Output valid JSON only. No markdown, no explanation, no extra text.",
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": "Irrigation Advisor",
          "Content-Type": "application/json",
        },
        timeout: 45000,
      }
    );

    const rawContent = data?.choices?.[0]?.message?.content;
    
    console.log("\n=== RAW LLM RESPONSE ===");
    console.log(rawContent);
    console.log("========================\n");

    // ---------- JSON RECOVERY FALLBACK ----------
    let jsonData = null;

    try {
      jsonData = JSON.parse(rawContent); // FIRST attempt
    } catch (error) {
      const match = rawContent.match(/\{[\s\S]*\}/); // extract closest JSON block
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
        raw: rawContent,
      });
    }

    // Return the English-Localized Data
    return res.json(jsonData);

  } catch (err) {
    console.log("IRRIGATION ERROR:", err.response?.data || err);
    return res.status(500).json({
      error: "Irrigation prediction failed",
      details: err.response?.data || err.message,
    });
  }
};