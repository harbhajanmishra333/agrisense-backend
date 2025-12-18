// controllers/marketDemandController.js
import axios from "axios";

const buildPrompt = (input) => `
You are an agriculture market-demand prediction expert.

Return ONLY VALID JSON. No explanations. No text outside JSON.

Input:
${JSON.stringify(input, null, 2)}

Your duty:
- Use real-world style reasoning about demand, supply, prices, season, festivals, weather, government policies, and logistics.
- For each crop, write a CLEAR, PRACTICAL analysis a farmer can understand.
- Especially in "future_forecast", explain WHAT is likely to happen, HOW it may unfold, and WHY (drivers, risks, seasonality).

Return EXACTLY the following JSON structure (same keys, no extra keys):

{
  "top_crops": [
    {
      "crop": "<name>",
      "market_demand_score": "<0-100>",
      "price_trend": "<rising|stable|falling>",
      "demand_drivers": ["<points>"],
      "supply_pressure": ["<points>"],
      "statewise_opportunity": {
        "top_states": ["<state1>", "<state2>"],
        "reason": "<short summary>"
      },
      "future_forecast": {
        "1_month": "<3-4 sentences: what demand and prices are likely in 1 month, and why (festivals, current stocks, trader behaviour, policies, weather, etc.)>",
        "3_month": "<3-4 sentences: how demand and prices may evolve over the next 3 months, and why (procurement, planting/harvest cycle, export signals, input costs, logistics, etc.)>",
        "6_month": "<3-4 sentences: longer-term scenario over 6 months, including possible risks, new harvest impact, climate uncertainty, and how farmers might be affected.>"
      },
      "best_season_to_grow": "<Kharif|Rabi|Zaid>",
      "recommended": true
    }
  ],
  "best_crop_choice": {
    "crop": "<crop name>",
    "reason": "<why this is the best, in 2-3 sentences using demand, risk, and profitability logic>"
  }
}
`;


export const marketDemand = async (req, res) => {
  try {
    const input = {
      location: req.body.location || "India",
      state: req.body.state || "UP",
      district: req.body.district || "Unknown",
      crop_list: req.body.crop_list || ["Wheat", "Paddy", "Maize", "Soybean"]
    };

    const prompt = buildPrompt(input);

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-oss-20b:free",
        messages: [
          { role: "system", content: "Return only JSON" },
          { role: "user", content: prompt }
        ],
        temperature: 0.1
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let text = response.data.choices?.[0]?.message?.content?.trim();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) json = JSON.parse(match[0]);
    }

    if (!json) {
      return res.status(500).json({
        error: "Invalid AI JSON",
        raw: text
      });
    }

    return res.json(json);

  } catch (err) {
    console.error("MARKET DEMAND ERROR:", err.response?.data || err);
    res.status(500).json({
      error: "Market demand prediction failed",
      details: err.response?.data || err.message
    });
  }
};
