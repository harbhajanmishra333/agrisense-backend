import axios from "axios";

export const irrigationAdvice = async (req, res) => {
  try {
    const { soil_type, crop, moisture } = req.body;

    if (!soil_type || !crop || moisture === undefined) {
      return res.status(400).json({ error: "soil_type, crop, moisture required" });
    }

    const prompt = `
You are an agricultural irrigation expert.

Soil Type: ${soil_type}
Crop: ${crop}
Moisture: ${moisture}%

Give ONLY valid JSON:

{
  "need_irrigation": true/false,
  "recommended_mm": number,
  "reason": "short reason",
  "risk": "short risk",
  "ai_explanation": "4-5 bullet points farmer-friendly"
}
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-oss-20b:free",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        }
      }
    );

    const aiJSON = JSON.parse(response.data.choices[0].message.content);
    res.json(aiJSON);

  } catch (err) {
    console.log("IRRIGATION ERR:", err.response?.data || err);
    res.status(500).json({ error: "Irrigation prediction failed" });
  }
};
