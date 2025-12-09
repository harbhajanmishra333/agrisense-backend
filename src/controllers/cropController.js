// controllers/cropController.js
import axios from "axios";

/**
 * Helper: small numeric normalizer
 */
const toNumberOrNull = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Basic yield estimate model (fallback, simple heuristic)
 * - baselineYield: typical tons/ha by crop (you can tune)
 * - modifiers: apply from NPK, moisture and temperature closeness to optimum
 */
const baselineYields = {
  Maize: 6.0,    // t/ha baseline
  Cotton: 2.0,
  Sorghum: 3.0,
  Wheat: 4.0,
  Paddy: 5.5,
  // add more if you want
};

function estimateYield(cropName, inputs) {
  const baseline = baselineYields[cropName] ?? 2.0;
  // simple scoring from 0..1 for each factor
  const N = (toNumberOrNull(inputs.nitrogen) ?? 0) / 100; // assume 0-100 scale
  const P = (toNumberOrNull(inputs.phosphorus) ?? 0) / 100;
  const K = (toNumberOrNull(inputs.potassium) ?? 0) / 100;
  const moisture = (toNumberOrNull(inputs.moisture) ?? 50) / 100; // 0-100 -> 0-1
  const temp = toNumberOrNull(inputs.temperature);
  // ideal temp effect: gaussian around 25C (very rough)
  const tempEffect = temp == null ? 1 : Math.exp(-Math.pow((temp - 25) / 10, 2));
  // aggregate nutrient score (cap between 0.4 and 1.6)
  const nutrientScore = Math.min(1.6, Math.max(0.4, 0.6 + 0.8 * ((N + P + K) / 3)));
  const moistureScore = Math.min(1.4, Math.max(0.6, 0.6 + 0.8 * moisture));
  const est = baseline * nutrientScore * moistureScore * tempEffect;
  // round to 2 decimals
  return Math.round(est * 100) / 100;
}

/**
 * Strict JSON schema instruction inserted into prompt to force structured output
 */
const buildPrompt = (input) => {
  const maxTokens = 1400;
  return `
You are an agriculture expert. Produce ONLY valid JSON and NOTHING else.

Input parameters:
${JSON.stringify(input, null, 2)}

Return a JSON array with exactly three objects (top 3 crops). Each object MUST follow this exact schema:

{
  "name": "<Crop name>",
  "reason": "<one-sentence primary reason>",
  "pros": "<2-3 pros separated by '; '>",
  "cons": "<2-3 cons separated by '; '>",
  "Growth": {
    "soil_requirements": {
      "pH_range": "<e.g. 6.0-7.5>",
      "texture": "<loam/sandy/clay>",
      "organic_matter": "<% or 'moderate'>",
      "CEC": "<meq/100g or 'unknown'>"
    },
    "water": {
      "rainfall_mm": "<range or number>",
      "irrigation": "<drip/flood/sprinkler>",
      "soil_moisture_percent_optimum": "<value or range>"
    },
    "temperature": {
      "optimum_range": "<e.g. 20-30°C>",
      "germination_min_max": "<e.g. 10-35°C>"
    },
    "nutrient_recommendation": {
      "N_kg_per_ha_total": "<number>",
      "P2O5_kg_per_ha_total": "<number>",
      "K2O_kg_per_ha_total": "<number>",
      "split_schedule": [
        {"stage":"<stage name>", "N": "<kg/ha>", "P2O5":"<kg/ha>", "K2O":"<kg/ha>", "timing":"<days after sowing or stage>"}
      ]
    },
    "growth_cycle_days": {
      "sowing_to_germination": "<days>",
      "vegetative": "<days>",
      "flowering": "<days>",
      "grain_fill_or_boll": "<days>",
      "harvest": "<days total>"
    },
    "fertilizer_tips": ["<short tip sentences>"],
    "pest_diseases": ["<top 3 pests/diseases>"]
  },
  "fertilizer_schedule": [
    {"stage":"<stage>", "description":"<what to apply>", "product_examples":"<urea, DAP, MOP etc>", "kg_per_ha":"<approx kg/ha>"}
  ],
  "monitoring": [
    {"item":"<soil test frequency>", "detail":"<how to monitor>"},
    {"item":"<pest scouting>", "detail":"<triggers/actions>"}
  ],
  "yield_estimate_t_per_ha": "<numeric estimate in t/ha or 'unknown'>",
  "confidence": "<low|medium|high> (based on input completeness)"
}

Return ONLY that JSON array and nothing else. Be concise and avoid extra commentary. Maximum output tokens: ${maxTokens}.
`;
};

export const predictCrop = async (req, res) => {
  try {
    const rawIn = req.body || {};

    // Normalize & create an input object with lots of possible params
    const input = {
      nitrogen: toNumberOrNull(rawIn.nitrogen),
      phosphorus: toNumberOrNull(rawIn.phosphorus),
      potassium: toNumberOrNull(rawIn.potassium),
      ph: toNumberOrNull(rawIn.ph),
      moisture: toNumberOrNull(rawIn.moisture),
      temperature: toNumberOrNull(rawIn.temperature),
      rainfall: toNumberOrNull(rawIn.rainfall),
      season: rawIn.season || "Kharif",
      texture: rawIn.texture || null,
      organic_matter: rawIn.organic_matter || null,
      cec: rawIn.cec || null,
      salinity: rawIn.salinity || null,
      elevation: rawIn.elevation || null,
      latitude: rawIn.latitude || null,
      longitude: rawIn.longitude || null,
      irrigation_type: rawIn.irrigation_type || null,
      previous_crop: rawIn.previous_crop || null,
      sowing_date: rawIn.sowing_date || null,
      expected_market_price: rawIn.expected_market_price || null
    };

    console.log("KEY LOADED:", process.env.OPENROUTER_API_KEY ? true : false);

    const prompt = buildPrompt(input);

    const apiReq = {
      model: "openai/gpt-oss-20b:free",
      messages: [
        { role: "system", content: "Return responses ONLY in valid JSON format." },
        { role: "user", content: prompt }
      ],
      temperature: 0.0,
      top_p: 1,
      // adjust other params as desired
    };

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      apiReq,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost"
,
          "X-Title": "AgriSense Crop Prediction"
        },
        timeout: 60000
      }
    );

    const text = response.data.choices?.[0]?.message?.content;
    console.log("RAW MODEL OUTPUT:", text?.slice?.(0, 200) ?? text);

    // Try strict JSON parse first
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // Fallback: try to extract JSON substring
      const jsonMatch = text && text.match(/(\[.*\])/s);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1]);
        } catch (e2) {
          console.log("Fallback JSON parse failed", e2);
        }
      }
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.log("Model returned invalid JSON. Returning error with raw text.");
      return res.status(500).json({ error: "Model returned invalid JSON", raw: text });
    }

    // Add programmatic yield estimate as a sanity-check (if model omitted it)
    const enhanced = parsed.map((cropObj) => {
      const name = cropObj.name ?? "Unknown";
      const modelYield = toNumberOrNull(cropObj.yield_estimate_t_per_ha) ? Number(cropObj.yield_estimate_t_per_ha) : null;
      const autoYield = estimateYield(name, input);
      // prefer model provided yield (if numeric), else auto estimate
      const yieldEstimate = modelYield ?? autoYield;
      return {
        ...cropObj,
        yield_estimate_t_per_ha: yieldEstimate,
        _yield_source: modelYield ? "model" : "auto_estimate",
        _input_used: input
      };
    });

    return res.json({ crops: enhanced });

  } catch (err) {
    console.error("Crop Prediction Error:", err?.response?.data || err.message || err);
    return res.status(500).json({ error: "Prediction failed", detail: err?.response?.data || err?.message });
  }
};
