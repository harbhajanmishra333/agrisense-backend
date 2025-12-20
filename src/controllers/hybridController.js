import axios from "axios";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/* ---------------- SAFE JSON EXTRACTOR ---------------- */
const extractJSON = (text) => {
  if (!text) throw new Error("Empty AI response");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error("RAW AI RESPONSE:", text);
    throw new Error("No JSON found in response");
  }
  return JSON.parse(match[0]);
};

/* ---------------- PROMPT ---------------- */
const buildPrompt = ({ crop, growth_stage, soil }) => `
You are a senior Indian agronomist.

Crop: ${crop}
Growth stage: ${growth_stage}

Soil nutrients (kg/ha):
N: ${soil.n}
P: ${soil.p}
K: ${soil.k}

TASK:
Provide hybrid fertilizer and pest control advice.

RULES:
- Organic first, chemical only if required
- Follow IPM principles
- Indian farming context
- Output ONLY JSON

FORMAT:
{
  "fertilizer": "string",
  "pest_control": "string",
  "precautions": "string"
}
`;

/* ---------------- CONTROLLER ---------------- */
export const hybridRecommend = async (req, res) => {
  try {
    const { crop, growth_stage, soil } = req.body;

    if (!crop || !growth_stage || !soil) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          { role: "system", content: "You are an expert agronomist." },
          { role: "user", content: buildPrompt({ crop, growth_stage, soil }) },
        ],
        temperature: 0.2,
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );

    const aiText = response.data.choices[0].message.content;

    const aiResult = extractJSON(aiText);

    return res.json({
      crop,
      growth_stage,
      fertilizer: aiResult.fertilizer,
      pest_control: aiResult.pest_control,
      precautions: aiResult.precautions,
      source: "openrouter",
    });
  } catch (err) {
    console.error("HYBRID OPENROUTER ERROR:", err.message);

    return res.json({
      fertilizer:
        "Apply balanced NPK as per soil test and crop growth stage.",
      pest_control:
        "Use neem oil or bio-pesticides first. Apply chemical pesticide only if pest level exceeds threshold.",
      precautions:
        "Avoid spraying during rain, strong wind, or peak sunlight hours.",
      source: "fallback",
    });
  }
};
