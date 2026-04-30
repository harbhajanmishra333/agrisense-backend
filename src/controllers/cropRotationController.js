import axios from "axios";

export const cropRotationAdvice = async (req, res) => {
  try {
    const { current_crop, soil_type } = req.body;

    const prompt = `
Suggest best crop rotation options for current crop: ${current_crop}.
Soil Type: ${soil_type}

Return JSON format:

{
  "rotation_options": [
    {
      "next_crop": "Crop Name",
      "benefit": "short explanation",
      "soil_improvement": "High/Medium/Low",
      "profit_expectation": "High/Medium/Low"
    }
  ]
}
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
          "X-Title": "Crop Rotation Advisor",
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
    let jsonData = null;

    try {
      jsonData = JSON.parse(rawContent); // FIRST attempt
    } catch (error) {
      const match = rawContent.match(/\{[\s\S]*\}/); // extract closest JSON block
      if (match) {
        try {
          jsonData = JSON.parse(match[0]); // SECOND attempt
        } catch (err2) {
          console.log("JSON PARSE FAIL:", err2);
        }
      }
    }

    // If STILL invalid → return raw text for debugging
    if (!jsonData) {
      return res.status(500).json({
        error: "Model returned invalid JSON",
        raw: rawContent,
      });
    }

    return res.json(jsonData);

  } catch (err) {
    console.log("CROP ROTATION ERROR:", err.response?.data || err);
    return res.status(500).json({
      error: "Crop rotation failed",
      details: err.response?.data || err.message,
    });
  }
};
