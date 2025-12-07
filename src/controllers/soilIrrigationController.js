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

    const openrouterRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-oss-20b:free",
        messages: [
          { role: "system", content: "Return responses ONLY in valid JSON format." },
          { role: "user", content: prompt },
        ],
        temperature: 0,
        top_p: 1,
        repetition_penalty: 1,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost",
          "X-Title": "AgriSense Irrigation Prediction",
        },
      }
    );

    let irrigation = {};
    try {
      irrigation = JSON.parse(openrouterRes.data.choices[0].message.content.trim());
    } catch (parseError) {
      console.error("Failed to parse OpenRouter response:", parseError);
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
