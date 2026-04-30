import axios from "axios";

export const rankCrops = async (req, res) => {
  try {
    const { location, soil_type, season } = req.body;

    const prompt = `
Rank the top 10 crops for:
Location: ${location}
Soil Type: ${soil_type}
Season: ${season}

Return JSON:

{
  "rankings": [
    {
      "rank": number,
      "crop": "name",
      "score": number,
      "profit_score": number,
      "demand_score": number,
      "risk_score": number,
      "climate_score": number
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
          "X-Title": "Crop Ranking Advisor",
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
    console.log("CROP RANKING ERROR:", err.response?.data || err);
    return res.status(500).json({
      error: "Crop ranking failed",
      details: err.response?.data || err.message,
    });
  }
};
