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
    res.status(500).json({ error: "Crop rotation failed" });
  }
};
