import axios from "axios";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/* ---------------- UTILS & SANITIZATION ---------------- */
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

// Standardizing stages to guide the LLM's biological clock
const VALID_STAGES = ["Sowing", "Seedling", "Vegetative", "Flowering", "Fruiting", "Maturity"];

/* ---------------- UPDATED PROMPT BUILDER ---------------- */
const buildPrompt = ({ crop, growth_stage, soil }) => {
  // Calculate a basic ratio to help the LLM identify deficiencies
  const total = soil.n + soil.p + soil.k || 1;
  const ratio = `${((soil.n/total)*100).toFixed(0)}% N, ${((soil.p/total)*100).toFixed(0)}% P, ${((soil.k/total)*100).toFixed(0)}% K`;

  return `
You are a senior ICAR-certified Indian agronomist.

CONTEXT:
- Crop: ${crop}
- Stage: ${growth_stage}
- Soil Nutrients (kg/ha): N:${soil.n}, P:${soil.p}, K:${soil.k}
- Nutrient Balance: ${ratio}

TASK:
Provide specific, actionable Indian agronomy advice using the Integrated Pest Management (IPM) framework.

RULES:
1. FERTILIZER: Suggest organic (FYM/Vermicompost) and specific chemical NPK/Urea doses if deficient.
2. PEST CONTROL: Suggest a 2-step approach (1. Bio-control like Neem oil, 2. Chemical intervention only if needed).
3. PRECAUTIONS: Must include safety gear and environmental warnings.
4. FORMAT: Return ONLY the JSON object. No conversational filler.

REQUIRED SCHEMA:
{
  "fertilizer": "string (specific dosage)",
  "pest_control": "string (IPM steps)",
  "precautions": "string (safety & weather warnings)",
  "is_emergency_intervention_needed": boolean
}
`;
};

/* ---------------- ENHANCED PARSER ---------------- */
const extractJSON = (text) => {
  if (!text) throw new Error("Empty response");
  try {
    // Attempt to find the first '{' and last '}'
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("Invalid format");
    return JSON.parse(text.substring(start, end + 1));
  } catch (err) {
    console.error("Parse failed for:", text);
    throw err;
  }
};

/* ---------------- CONTROLLER ---------------- */
export const hybridRecommend = async (req, res) => {
  // 1. Robust Input Validation
  const crop = req.body.crop?.trim();
  const growth_stage = VALID_STAGES.includes(req.body.growth_stage) 
    ? req.body.growth_stage 
    : "Vegetative";

  const soil = {
    n: num(req.body.soil?.n),
    p: num(req.body.soil?.p),
    k: num(req.body.soil?.k)
  };

  if (!crop) return res.status(400).json({ error: "Crop name is required" });

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          { 
            role: "system", 
            content: "You are a JSON-only API for Indian Agronomy. You never use markdown code blocks or text outside the JSON object." 
          },
          { role: "user", content: buildPrompt({ crop, growth_stage, soil }) },
        ],
        temperature: 0.1, // Lower temperature = more consistent JSON
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5000",
          "X-Title": "AgriSense Advisor",
        },
        timeout: 25000,
      }
    );

    const aiResult = extractJSON(response.data.choices[0].message.content);

    return res.json({
      meta: { crop, growth_stage, status: "success" },
      advice: aiResult,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("ADVISOR ERROR:", err.message);

    // 2. Intelligent Fallback (Context-Aware)
    return res.status(200).json({
      meta: { crop, growth_stage, status: "fallback" },
      advice: {
        fertilizer: `Based on current ${growth_stage} stage, apply balanced NPK 19-19-19 soluble fertilizer. Check soil pH before heavy Urea application.`,
        pest_control: "Monitor for local pests. Apply Neem oil (3000 PPM) at 5ml/L as a preventive measure.",
        precautions: "Use mask and gloves. Avoid spraying during high wind or flowering peak to protect pollinators.",
        is_emergency_intervention_needed: false
      }
    });
  }
};