import axios from "axios";
import { CROPS, BASE_YIELD } from "../data/crop.js";

/* ===================== UTILS (Keep same) ===================== */
const num = (v) => {
  if (typeof v === 'string') v = v.replace(/[^0-9.]/g, '');
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ===================== SCORING LOGIC (Keep same) ===================== */
const scoreByOptimum = (value, range) => {
  if (value == null || !range) return 0;
  const { min, opt, max } = range;
  if (value < min || value > max) return -5;
  const halfRange = (max - min) / 2 || 1;
  const dist = Math.abs(value - opt);
  return +clamp(5 * (1 - dist / halfRange), 0, 5).toFixed(2);
};

const estimateYield = (cropName, i) => {
  const base = BASE_YIELD[cropName] ?? 2;
  const n = (num(i.nitrogen) ?? 40) / 100;
  const p = (num(i.phosphorus) ?? 40) / 100;
  const k = (num(i.potassium) ?? 40) / 100;
  
  const npkAvg = (n + p + k) / 3;
  const npkFactor = clamp(npkAvg, 0.6, 1.6);
  const moisture = clamp((num(i.moisture) ?? 50) / 100, 0.4, 1);
  const t = num(i.temperature) ?? 25;
  const tempFactor = Math.exp(-Math.pow((t - 25) / 12, 2));

  return +(base * npkFactor * moisture * tempFactor).toFixed(2);
};

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

/* ===================== PROMPT UPDATED FOR HINDI CONTENT ===================== */
const buildPrompt = (input, scoredList) => `
You are a senior Indian agronomy expert fluent in Hindi (Devanagari).
Analyze these 3 specific crops: ${scoredList.slice(0, 3).map(c => c.name).join(", ")}.

INPUT DATA:
- Soil: pH ${input.ph}, NPK(${input.nitrogen}, ${input.phosphorus}, ${input.potassium})
- Climate: Temp ${input.temperature}°C, Season ${input.season}, Rainfall ${input.rainfall}mm

TASK:
Return a JSON array of 3 objects.
RULES:
1. "name" must be the EXACT English name from the list.
2. "reason" must be in HINDI. Explain why the crop fits the soil/climate.
3. "growth_summary" must be in HINDI.
4. "confidence" must be in HINDI (e.g., उच्च, मध्यम).

REQUIRED JSON SCHEMA:
[
 {
  "name": "Exact English Name",
  "reason": "Technical reason in Hindi (Devanagari)",
  "growth_summary": "Growth cycle summary in Hindi (Devanagari)",
  "confidence": "Hindi Word"
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
          temperature: 0.2, // Low temp prevents hallucinating names
          max_tokens: 1500,
          messages: [
            { role: "system", content: "You are an Agronomy API. Output JSON only." },
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
      console.error("LLM Error, falling back to local data.", err.message);
    }

    // ================= MERGING LOGIC =================
    // We iterate over our LOCALLY SCORED list (Top 3) to ensure English names are correct.
    const finalRecommendations = scoredList.slice(0, 3).map((localItem, idx) => {
      
      // Try to find the matching AI result by English name
      const aiItem = llmResult.find(
        (ai) => ai.name && ai.name.toLowerCase() === localItem.name.toLowerCase()
      ) || llmResult[idx] || {}; // Fallback to index if name match fails

      const thresholds = getCropThresholds(localItem.name);

      return {
        // 1. NAME: Always use Local English Name (Safe)
        name: localItem.name,
        
        // 2. STATS: Calculated locally (Accurate)
        rank: idx + 1,
        algorithm_score: localItem.score,
        is_algorithm_top_choice: idx === 0,
        yield_estimate_t_per_ha: estimateYield(localItem.name, input),
        growth: {
           thresholds: thresholds,
           // 3. SUMMARY: Use AI Hindi or Fallback Hindi
           summary: aiItem.growth_summary || "विकास चक्र और मिट्टी की अनुकूलता का विश्लेषण किया जा रहा है।",
        },

        // 4. REASON: Use AI Hindi or Fallback Hindi
        reason: aiItem.reason || "मिट्टी और जलवायु की स्थिति इस फसल के लिए उपयुक्त है।",
        
        confidence: aiItem.confidence || "मध्यम"
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