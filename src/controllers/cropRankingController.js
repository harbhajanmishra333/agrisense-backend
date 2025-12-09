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

    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-oss-20b:free",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const clean = response.data.choices[0].message.content.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(clean));

  } catch (err) {
    res.status(500).json({ error: "Ranking failed" });
  }
};
