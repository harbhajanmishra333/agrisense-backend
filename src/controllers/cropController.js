import axios from "axios";
import { CROPS, BASE_YIELD } from "../data/crop.js";

/* ===================== UTILS ===================== */
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ===================== OPTIMUM SCORING ===================== */
const scoreByOptimum = (value, { min, opt, max }) => {
  if (value == null) return 0;
  if (value < min || value > max) return -5;

  const halfRange = (max - min) / 2 || 1;
  const dist = Math.abs(value - opt);
  return +clamp(5 * (1 - dist / halfRange), 0, 5).toFixed(2);
};

/* ===================== YIELD MODEL ===================== */
const estimateYield = (cropName, i) => {
  const base = BASE_YIELD[cropName] ?? 2;

  const npkAvg =
    ["nitrogen", "phosphorus", "potassium"]
      .map((k) => (num(i[k]) ?? 40) / 100)
      .reduce((a, b) => a + b, 0) / 3;

  const npkFactor = clamp(npkAvg, 0.6, 1.6);
  const moisture = clamp((num(i.moisture) ?? 50) / 100, 0.4, 1);

  const t = num(i.temperature);
  const tempFactor = t ? Math.exp(-Math.pow((t - 25) / 10, 2)) : 1;

  return +(base * npkFactor * moisture * tempFactor).toFixed(2);
};

/* ===================== DECISION ENGINE ===================== */
const SEASONS = new Set(["Kharif", "Rabi", "Summer", "Annual", "Perennial"]);

const scoreCrop = (crop, i) => {
  let score = 0;

  score += crop.seasons.includes(i.season) ? 10 : -10;
  score += scoreByOptimum(i.ph, crop.ph);
  score += scoreByOptimum(i.rainfall, crop.rainfall);
  score += scoreByOptimum(i.moisture, crop.moisture);
  score += scoreByOptimum(i.temperature, crop.temperature);
  score += scoreByOptimum(i.nitrogen, crop.nutrients.N);
  score += scoreByOptimum(i.phosphorus, crop.nutrients.P);
  score += scoreByOptimum(i.potassium, crop.nutrients.K);

  score += crop.priority ?? 0;
  score += (BASE_YIELD[crop.name] ?? 2) * 0.3;

  return score;
};

const shortlistCrops = (input, limit = 7) =>
  CROPS.map((c) => ({
    name: c.name,
    score: +scoreCrop(c, input).toFixed(2),
    seasons: c.seasons,
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

/* ===================== CROP THRESHOLD LOOKUP ===================== */
const getCropThresholds = (cropName) => {
  const crop = CROPS.find((c) => c.name === cropName);
  if (!crop) return null;

  return {
    temperature: {
      min: crop.temperature.min,
      max: crop.temperature.max,
    },
    ph: {
      min: crop.ph.min,
      max: crop.ph.max,
    },
    moisture: {
      min: crop.moisture.min,
      max: crop.moisture.max,
    },
  };
};

/* ===================== PROMPT BUILDER ===================== */
const buildPrompt = (input, scoredList) => `
You are an Indian agriculture expert.

Select EXACTLY 3 crops from the candidate list.
Do NOT invent crops.
Do NOT use generic ranges.

IMPORTANT:
- Thresholds MUST be realistic and crop-specific
- Use agronomic standards (ICAR-like values)

Return ONLY valid JSON.

Schema:
[
 {
  "name": "string",
  "reason": "string",
  "pros": "string",
  "cons": "string",
  "growth": {
    "summary": "string",
    "thresholds": {
      "temperature": { "min": number, "max": number },
      "ph": { "min": number, "max": number },
      "moisture": { "min": number, "max": number }
    }
  },
  "rank": number,
  "algorithm_score": number,
  "is_algorithm_top_choice": boolean,
  "confidence": "low|medium|high"
 }
]

INPUT:
${JSON.stringify(input)}

CANDIDATES:
${JSON.stringify(scoredList)}
`;

/* ===================== SAFE PARSER ===================== */
const safeParseArray = (text) => {
  if (!text || typeof text !== "string") return null;

  try {
    // Remove common wrappers / tokens
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/<s>/g, "")
      .replace(/\[\/INST\]/g, "")
      .replace(/\u0000/g, "")
      .trim();

    // 🔥 REGEX: extract first JSON array (most important fix)
    const match = cleaned.match(/\[[\s\S]*\]/);

    if (!match) return null;

    return JSON.parse(match[0]);
  } catch (err) {
    console.error("safeParseArray failed:", err.message);
    return null;
  }
};

/* ===================== CONTROLLER ===================== */
export const predictCrop = async (req, res) => {
  try {
    const seasonRaw = req.body.season || "Kharif";
    const season = SEASONS.has(seasonRaw) ? seasonRaw : "Kharif";

    const input = {
      nitrogen: num(req.body.nitrogen),
      phosphorus: num(req.body.phosphorus),
      potassium: num(req.body.potassium),
      ph: num(req.body.ph),
      moisture: num(req.body.moisture),
      temperature: num(req.body.temperature),
      rainfall: num(req.body.rainfall),
      season,
    };

    const scoredList = shortlistCrops(input);
    const prompt = buildPrompt(input, scoredList);

    let llmResult = null;
    let rawLlmText = null;

    /* ---- LLM CALL ---- */
    try {
      const { data } = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "mistralai/mistral-7b-instruct",

          temperature: 0,
           max_tokens: 800,
          messages: [
            {
              role: "system",
              content:
                "You are a JSON API. Return ONLY valid JSON. No explanations.",
            },
            { role: "user", content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "AgriSense Crop Advisor",
          },
          timeout: 60000,
        }
      );

      rawLlmText = data?.choices?.[0]?.message?.content;
      llmResult = safeParseArray(rawLlmText);
    } catch (err) {
      console.error("LLM request failed:", err.message);
    }

    console.log("RAW LLM TEXT:", rawLlmText);
    console.log("PARSED LLM JSON:", llmResult);

    /* ---- FALLBACK ---- */
    if (!Array.isArray(llmResult) || llmResult.length === 0) {
      llmResult = scoredList.slice(0, 3).map((c, idx) => ({
        name: c.name,
        reason: "Selected based on agronomic suitability scoring.",
        pros: "Suitable soil-climate match; Stable performance",
        cons: "Requires proper management",
        growth: { summary: "Follow standard agronomic practices." },
        rank: idx + 1,
        algorithm_score: c.score,
        is_algorithm_top_choice: idx === 0,
        confidence: "medium",
      }));
    }

    /* ---- FINAL ENRICHMENT ---- */
    const final = llmResult.map((c, idx) => {
      const fallbackThresholds = getCropThresholds(c.name);

      return {
        ...c,

        reason:
          typeof c.reason === "string" && c.reason.trim().length > 0
            ? c.reason
            : "This crop is suitable for the given soil and climate conditions.",

        pros:
          typeof c.pros === "string" && c.pros.trim().length > 0
            ? c.pros
            : "Good agro-climatic compatibility; Stable performance",

        cons:
          typeof c.cons === "string" && c.cons.trim().length > 0
            ? c.cons
            : "Requires proper crop management",

        growth: {
          summary:
            c.growth?.summary ||
            "Follow recommended agronomic practices for optimal yield.",

          thresholds: {
            temperature:
              c.growth?.thresholds?.temperature?.min > 0
                ? c.growth.thresholds.temperature
                : fallbackThresholds?.temperature,

            ph:
              c.growth?.thresholds?.ph?.min > 0
                ? c.growth.thresholds.ph
                : fallbackThresholds?.ph,

            moisture:
              c.growth?.thresholds?.moisture?.min > 0
                ? c.growth.thresholds.moisture
                : fallbackThresholds?.moisture,
          },
        },

        rank: idx + 1,
        yield_estimate_t_per_ha: estimateYield(c.name, input),
      };
    });

    return res.json({
      algorithm_selection: scoredList,
      llm_recommendations: final,
    });
  } catch (err) {
    console.error("predictCrop error:", err.message);
    return res.status(500).json({ error: "Prediction failed" });
  }
};
