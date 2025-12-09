// controllers/marketController.js
import axios from "axios";

/**
 * Helper numeric normalizer
 */
const toNum = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Simple programmatic yield estimator
 */
const baselineYields = {
  Wheat: 4.0,
  Paddy: 5.5,
  Maize: 6.0,
  Cotton: 2.0,
  Soybean: 2.2,
  Mustard: 1.6,
  Sugarcane: 80,
};

function estimateYield(crop, inputs) {
  const base = baselineYields[crop] ?? 3.0;

  const N = (inputs.n ?? 50) / 100;
  const P = (inputs.p ?? 50) / 100;
  const K = (inputs.k ?? 50) / 100;
  const moisture = (inputs.moisture ?? 50) / 100;

  const temp = toNum(inputs.temperature);
  const tempEffect = temp ? Math.exp(-Math.pow((temp - 25) / 10, 2)) : 1;

  const nutrientScore = Math.min(1.4, Math.max(0.6, 0.6 + (N + P + K) / 3));
  const moistureScore = Math.min(1.4, Math.max(0.6, 0.6 + moisture));

  const est = base * nutrientScore * moistureScore * tempEffect;
  return Math.round(est * 100) / 100;
}

/**
 * AI prompt builder for Market + Yield + Profit + Forecasts
 */
const buildPrompt = (input) => `
You are an agriculture market intelligence expert. 
Return ONLY VALID JSON. No explanations.

Input:
${JSON.stringify(input, null, 2)}

You must return EXACTLY this JSON structure:

{
  "crop_analysis": [
    {
      "crop": "<name>",
      "market_price_per_quintal": "<number>",
      "expected_yield_t_per_ha": "<number>",
      "expected_revenue_per_ha": "<number>",
      "input_cost_per_ha": "<number>",
      "expected_profit_per_ha": "<number>",
      "risk_level": "<low|medium|high>",
      "market_trend": "<rising|stable|falling>",
      "demand_factors": ["<points>"],
      "supply_factors": ["<points>"],
      "pest_disease_risk": ["<points>"],
      "future_season_forecast": {
        "kharif": {
          "recommended": "<yes/no>",
          "reason": "<short reason>"
        },
        "rabi": {
          "recommended": "<yes/no>",
          "reason": "<short reason>"
        },
        "zaid": {
          "recommended": "<yes/no>",
          "reason": "<short reason>"
        }
      }
    }
  ],
  "best_crop_suggestion": {
    "crop": "<best crop>",
    "reason": "<short justification>"
  }
}
ONLY return JSON.
`;

export const marketIntelligence = async (req, res) => {
  try {
    const input = {
      crop_list: req.body.crops || ["Wheat", "Paddy", "Maize"],
      n: toNum(req.body.nitrogen),
      p: toNum(req.body.phosphorus),
      k: toNum(req.body.potassium),
      moisture: toNum(req.body.moisture),
      temperature: toNum(req.body.temperature),
      rainfall: toNum(req.body.rainfall),
      state: req.body.state || "UP",
      district: req.body.district || "Unknown"
    };

    const prompt = buildPrompt(input);

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-oss-20b:free",
        temperature: 0.2,
        messages: [
          { role: "system", content: "Strictly output JSON" },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        }
      }
    );

    let text = response.data.choices?.[0]?.message?.content?.trim();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) json = JSON.parse(match[0]);
    }

    if (!json) {
      return res.status(500).json({
        error: "Invalid AI JSON",
        raw: text
      });
    }

    // Add local yield estimator for accuracy improvement
    json.crop_analysis = json.crop_analysis.map((c) => {
      const autoYield = estimateYield(c.crop, input);
      c.auto_yield_t_per_ha = autoYield;
      return c;
    });

    return res.json(json);

  } catch (err) {
    console.error("MARKET INTELLIGENCE ERROR:", err.response?.data || err);
    return res.status(500).json({
      error: "Market prediction failed",
      detail: err.response?.data || err.message
    });
  }
};
