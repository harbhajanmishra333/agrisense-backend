import axios from "axios";

export const predictCrop = async (req, res) => {
  try {
    const input = req.body;

    console.log("KEY LOADED:", process.env.OPENROUTER_API_KEY ? true : false);

    const prompt = `
You are an agricultural crop prediction expert.

Given the following parameters:
${JSON.stringify(input, null, 2)}

Predict the TOP 3 best crops to grow.

Return ONLY valid JSON in this format:

[
  {
    "name": "Crop Name",
    "reason": "main reason in one sentence",
    "pros": "2–3 pros",
    "cons": "2–3 cons"
  }
]

No explanations outside JSON.
    `;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-oss-20b:free",
        messages: [
          { role: "system", content: "Return responses ONLY in valid JSON format." },
          { role: "user", content: prompt }
        ],
        temperature: 0,
    top_p: 1,
    repetition_penalty: 1
      },
      {
        
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",

          // REQUIRED HEADERS FOR OPENROUTER
          "HTTP-Referer": "http://localhost",
          "X-Title": "AgriSense Crop Prediction"
        },
      }
    );

    const text = response.data.choices[0].message.content;
    console.log("RAW MODEL OUTPUT:", text);

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.log("Invalid JSON returned:", text);
      return res.status(500).json({
        error: "Model returned invalid JSON",
        raw: text
      });
    }

    return res.json({ crops: json });

  } catch (err) {
    console.log("Crop Prediction Error:", err.response?.data || err);
    return res.status(500).json({ error: "Prediction failed" });
  }
};
