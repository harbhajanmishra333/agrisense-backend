import axios from "axios";
import { CROPS, BASE_YIELD } from "../data/crop.js";

/* ===================== UTILS ===================== */
const num = (v) => {
  if (typeof v === "string") v = v.replace(/[^0-9.]/g, "");
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ===================== SCORING LOGIC ===================== */
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
  if (!BASE_YIELD[cropName]) {
    console.warn(`[WARN] No BASE_YIELD entry for "${cropName}", using default 2`);
  }

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
  score += crop.priority ?? 0;
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

/* ===================== PROMPT ===================== */
const buildPrompt = (input, scoredList) => `
You are a senior Indian agronomy expert.
Analyze these 3 specific crops: ${scoredList
  .slice(0, 3)
  .map((c) => c.name)
  .join(", ")}.

INPUT DATA:
- Soil: pH ${input.ph}, NPK(${input.nitrogen}, ${input.phosphorus}, ${input.potassium})
- Climate: Temp ${input.temperature}°C, Season ${input.season}, Rainfall ${input.rainfall}mm

TASK:
Return a JSON array of exactly 3 objects.
RULES:
1. "name" must be the EXACT English crop name from the list above.
2. "reason" must be in ENGLISH. Explain why the crop fits the soil/climate.
3. "growth_summary" must be in ENGLISH. Describe the growth cycle briefly.
4. "confidence" must be one of: High, Medium, Low.

OUTPUT FORMAT (JSON only, no extra text, no markdown):
[
  {
    "name": "Exact English Name",
    "reason": "Technical reason in English",
    "growth_summary": "Growth cycle summary in English",
    "confidence": "High"
  }
]
`;

/* ===================== SAFE PARSER ===================== */
const safeParseArray = (text) => {
  if (!text || typeof text !== "string") {
    console.warn("[safeParseArray] Received null or non-string content.");
    return null;
  }
  try {
    // 1. Strip out markdown formatting if the LLM adds it (```json ... ```)
    let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    // 2. Find the first '[' and the last ']'
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");

    if (start === -1 || end === -1) {
      console.warn("[safeParseArray] No array brackets found.");
      return null;
    }

    // 3. Extract and parse the exact JSON block
    const jsonString = cleaned.substring(start, end + 1);
    const parsed = JSON.parse(jsonString);

    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.error("[safeParseArray] JSON parse failed:", err.message);
    return null;
  }
};

/* ===================== CONTROLLER ===================== */
export const predictCrop = async (req, res) => {
  try {
    /* ---------- 1. Parse & validate input ---------- */
    const season = (req.body.season || "").trim();

    const input = {
      nitrogen: num(req.body.nitrogen),
      phosphorus: num(req.body.phosphorus),
      potassium: num(req.body.potassium),
      ph: num(req.body.ph),
      moisture: num(req.body.moisture),
      temperature: num(req.body.temperature),
      rainfall: num(req.body.rainfall),
      season: SEASONS.has(season) ? season : "Kharif",
    };

    const missingFields = [
      "nitrogen", "phosphorus", "potassium",
      "ph", "moisture", "temperature", "rainfall",
    ].filter((f) => input[f] === null);

    if (missingFields.length > 0) {
      console.warn("[WARN] Missing input fields, using defaults:", missingFields);
    }

    /* ---------- 2. Local scoring ---------- */
    const scoredList = shortlistCrops(input);
    const prompt = buildPrompt(input, scoredList);

    /* ---------- 3. LLM call ---------- */
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("[ERROR] OPENROUTER_API_KEY is not set in environment variables.");
    }

    let llmResult = [];
    try {
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
            "X-Title": "Crop Advisor",
            "Content-Type": "application/json",
          },
          timeout: 45000,
        }
      );

      const rawContent = data?.choices?.[0]?.message?.content;
      
      console.log("\n=== RAW LLM RESPONSE ===");
      console.log(rawContent);
      console.log("========================\n");

      llmResult = safeParseArray(rawContent) || [];
    } catch (err) {
      console.error(
        "[LLM Error] Falling back to local data.",
        err.response?.status,
        JSON.stringify(err.response?.data) || err.message
      );
    }

    /* ---------- 4. Merge local + LLM results ---------- */
    const finalRecommendations = scoredList.slice(0, 3).map((localItem, idx) => {
      const aiItem =
        llmResult.find(
          (ai) => ai?.name && ai.name.toLowerCase() === localItem.name.toLowerCase()
        ) || {};

      const thresholds = getCropThresholds(localItem.name);

      return {
        name: localItem.name,
        rank: idx + 1,
        algorithm_score: localItem.score,
        is_algorithm_top_choice: idx === 0,
        yield_estimate_t_per_ha: estimateYield(localItem.name, input),
        growth: {
          thresholds,
          summary:
            aiItem.growth_summary ||
            "Growth cycle and soil compatibility analysis in progress.",
        },
        reason:
          aiItem.reason ||
          "Soil and climate conditions are suitable for this crop.",
        confidence: aiItem.confidence || "Medium",
      };
    });

    /* ---------- 5. Send response ---------- */
    return res.json({
      input_echo: input,
      recommendations: finalRecommendations,
    });

  } catch (err) {
    console.error("[Controller Error]:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};