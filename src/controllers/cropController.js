import axios from "axios";
import { CROPS, BASE_YIELD } from "../data/crop.js";

/* ===================== UTILS ===================== */
const num = (v) => {
  if (typeof v === 'string') v = v.replace(/[^0-9.]/g, '');
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ===================== OPTIMUM SCORING ===================== */
const scoreByOptimum = (value, range) => {
  if (value == null || !range) return 0;
  const { min, opt, max } = range;
  if (value < min || value > max) return -5;

  const halfRange = (max - min) / 2 || 1;
  const dist = Math.abs(value - opt);
  return +clamp(5 * (1 - dist / halfRange), 0, 5).toFixed(2);
};

/* ===================== YIELD MODEL ===================== */
const estimateYield = (cropName, i) => {
  const base = BASE_YIELD[cropName] ?? 2;
  const n = (num(i.nitrogen) ?? 40) / 100;
  const p = (num(i.phosphorus) ?? 40) / 100;
  const k = (num(i.potassium) ?? 40) / 100;
  
  const npkAvg = (n + p + k) / 3;
  const npkFactor = clamp(npkAvg, 0.6, 1.6);
  const moisture = clamp((num(i.moisture) ?? 50) / 100, 0.4, 1);

  const t = num(i.temperature) ?? 25;
  // Gaussian bell curve for temp: Peak at 25°C
  const tempFactor = Math.exp(-Math.pow((t - 25) / 12, 2));

  return +(base * npkFactor * moisture * tempFactor).toFixed(2);
};

/* ===================== DECISION ENGINE ===================== */
const SEASONS = new Set(["Kharif", "Rabi", "Summer", "Annual", "Perennial"]);

const scoreCrop = (crop, i) => {
  let score = 0;
  score += crop.seasons.includes(i.season) ? 12 : -15;
  score += scoreByOptimum(i.ph, crop.ph);
  score += scoreByOptimum(i.rainfall, crop.rainfall);
  score += scoreByOptimum(i.moisture, crop.moisture);
  score += scoreByOptimum(i.temperature, crop.temperature);
  score += scoreByOptimum(i.nitrogen, crop.nutrients.N);
  score += scoreByOptimum(i.phosphorus, crop.nutrients.P);
  score += scoreByOptimum(i.potassium, crop.nutrients.K);
  score += (crop.priority ?? 0);
  return +score.toFixed(2);
};

const shortlistCrops = (input, limit = 7) =>
  CROPS.map((c) => ({
    name: c.name,
    score: scoreCrop(c, input),
    seasons: c.seasons,
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

const getCropThresholds = (cropName) => {
  const crop = CROPS.find((c) => c.name === cropName);
  if (!crop) return null;
  return {
    temperature: { min: crop.temperature.min, max: crop.temperature.max },
    ph: { min: crop.ph.min, max: crop.ph.max },
    moisture: { min: crop.moisture.min, max: crop.moisture.max },
  };
};

/* ===================== PROMPT BUILDER ===================== */
const buildPrompt = (input, scoredList) => `
You are a senior Indian agronomy expert.
Analyze these 3 specific crops: ${scoredList.slice(0, 3).map(c => c.name).join(", ")}.

INPUT DATA:
- Soil: pH ${input.ph}, NPK(${input.nitrogen}, ${input.phosphorus}, ${input.potassium})
- Climate: Temp ${input.temperature}°C, Season ${input.season}, Rainfall ${input.rainfall}mm

TASK:
Return a JSON array of 3 objects. Use ONLY these names: ${scoredList.slice(0, 3).map(c => c.name).join(", ")}.

REQUIRED JSON SCHEMA:
[
 {
  "name": "string",
  "reason": "Technical sentence on climate-soil fit",
  "pros": "5 pros separated by '; '",
  "cons": "5 cons separated by '; '",
  "growth_summary": "Summary of germination to harvest",
  "confidence": "low|medium|high"
 }
]
`;

/* ===================== SAFE PARSER ===================== */
const safeParseArray = (text) => {
  try {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.substring(start, end + 1));
  } catch (err) {
    return null;
  }
};

/* ===================== CONTROLLER ===================== */
export const predictCrop = async (req, res) => {
  try {
    const input = {
      nitrogen: num(req.body.nitrogen),
      phosphorus: num(req.body.phosphorus),
      potassium: num(req.body.potassium),
      ph: num(req.body.ph),
      moisture: num(req.body.moisture),
      temperature: num(req.body.temperature),
      rainfall: num(req.body.rainfall),
      season: SEASONS.has(req.body.season) ? req.body.season : "Kharif",
    };

    const scoredList = shortlistCrops(input);
    const prompt = buildPrompt(input, scoredList);

    let llmResult = [];
    try {
      const { data } = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "mistralai/mistral-7b-instruct",
          temperature: 0.1,
          max_tokens: 1000,
          messages: [
            { role: "system", content: "You are a specialized Agronomy API. Output JSON only." },
            { role: "user", content: prompt },
          ],
        },
        {
          headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
          timeout: 45000,
        }
      );
      llmResult = safeParseArray(data?.choices?.[0]?.message?.content) || [];
    } catch (err) {
      console.error("LLM Error, falling back to local data.");
    }

    // ENRICHMENT: Merge LLM descriptions with Local Hard Data
    const finalRecommendations = (llmResult.length > 0 ? llmResult : scoredList.slice(0, 3)).map((item, idx) => {
      const cropName = item.name;
      const localData = scoredList.find(s => s.name === cropName) || scoredList[idx];
      const thresholds = getCropThresholds(localData.name);

      return {
        name: localData.name,
        rank: idx + 1,
        algorithm_score: localData.score,
        is_algorithm_top_choice: localData.name === scoredList[0].name,
        reason: item.reason || "High suitability based on soil parameters.",
        pros: item.pros || "Reliable yield; Adaptive to local climate",
        cons: item.cons || "Requires monitoring for pests",
        growth: {
          summary: item.growth_summary || "Standard growth cycle for " + input.season,
          thresholds: thresholds
        },
        yield_estimate_t_per_ha: estimateYield(localData.name, input),
        confidence: item.confidence || "medium"
      };
    });

    return res.json({
      input_echo: input,
      recommendations: finalRecommendations
    });

  } catch (err) {
    console.error("Controller Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};