import axios from "axios";
import FormData from "form-data";

export const analyzeSoilAndIrrigation = async (req, res) => {
  try {
    const { moisture, crop } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "soilImage missing" });
    }

    // --- 1️⃣ Send Image to ML Flask Server ---
    const flaskURL = "http://127.0.0.1:5001/api/soil/predict";
    const form = new FormData();
    form.append("soilImage", req.file.buffer, {
      filename: "soil.jpg",
      contentType: "image/jpeg",
    });

    const flaskRes = await axios.post(flaskURL, form, {
      headers: form.getHeaders(),
    });

    const soil_type = flaskRes.data.soil_type;
    const confidence = flaskRes.data.confidence;

    // --- 2️⃣ Irrigation prediction using OpenRouter ---
    const input = {
      soil_type,
      crop,
      moisture,
    };

    const prompt = `
You are an irrigation expert.

Given the following parameters:
${JSON.stringify(input, null, 2)}

Provide irrigation recommendation in JSON format:

{
  "need_irrigation": true/false,
  "recommended_water_mm": number,
  "reason": "reason in one sentence",
  "risk": "risk in one sentence",
  "advice": ["advice 1", "advice 2"]
}

No explanations outside JSON.
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
          "X-Title": "Soil Irrigation Advisor",
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
    let irrigation = null;

    try {
      irrigation = JSON.parse(rawContent); // FIRST attempt
    } catch (error) {
      const match = rawContent.match(/\{[\s\S]*\}/); // extract closest JSON block
      if (match) {
        try {
          irrigation = JSON.parse(match[0]); // SECOND attempt
        } catch (err2) {
          console.log("JSON PARSE FAIL:", err2);
        }
      }
    }

    // If STILL invalid → return raw text for debugging
    if (!irrigation) {
      return res.status(500).json({
        error: "Model returned invalid JSON",
        raw: rawContent,
      });
    }

    // Send results back
    return res.json({
      soil_type,
      confidence,
      irrigation,
    });
  } catch (err) {
    console.log("Soil + Irrigation ERROR:", err.response?.data || err);
    res.status(500).json({ error: "Processing failed" });
  }
};
