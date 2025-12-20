// controllers/marketController.js
import axios from "axios";

/* ==========================================================================
   1. UTILITIES & CONFIGURATION
   ========================================================================== */

const toNum = (v) => {
  if (v === undefined || v === null || v === "") return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

// Robust baseline data for Yield (t/ha) and Market Price (INR/quintal)
const CROP_DATA = {
  Wheat: { base_yield: 4.0, base_price: 2275, cost_per_ha: 25000 },
  Paddy: { base_yield: 5.5, base_price: 2183, cost_per_ha: 30000 },
  Maize: { base_yield: 6.0, base_price: 2090, cost_per_ha: 28000 },
  Cotton: { base_yield: 2.0, base_price: 6620, cost_per_ha: 35000 },
  Soybean: { base_yield: 2.2, base_price: 4600, cost_per_ha: 22000 },
  Mustard: { base_yield: 1.6, base_price: 5650, cost_per_ha: 18000 },
  Sugarcane: { base_yield: 80.0, base_price: 315, cost_per_ha: 60000 }, // Price per quintal is lower for cane
  Potato: { base_yield: 25.0, base_price: 1500, cost_per_ha: 45000 },
  Tomato: { base_yield: 30.0, base_price: 2000, cost_per_ha: 50000 }
};

/* ==========================================================================
   2. LOCAL MATH ENGINES (The "Truth" Layer)
   ========================================================================== */

/**
 * Calculates yield based on environmental inputs.
 * This is more reliable than LLM guessing.
 */
function calculateLocalYield(cropName, inputs) {
  const defaults = CROP_DATA[cropName] || { base_yield: 3.0 };
  const base = defaults.base_yield;

  const n = (inputs.n ?? 50) / 100; // Normalize relative to ~100kg/ha
  const p = (inputs.p ?? 50) / 100;
  const k = (inputs.k ?? 50) / 100;
  
  // NPK Logic: Optimal is around 1.0. Deficiencies hurt yield.
  const nutrientFactor = Math.min(1.3, Math.max(0.7, (n + p + k) / 3 + 0.5));
  
  // Moisture Logic: 
  const moisture = (inputs.moisture ?? 50) / 100;
  const moistureFactor = Math.min(1.2, Math.max(0.6, 0.5 + moisture));

  // Temperature Logic: Gaussian curve peaking at 25°C
  const temp = inputs.temperature || 25;
  const tempFactor = Math.exp(-Math.pow((temp - 25) / 15, 2)); 

  return parseFloat((base * nutrientFactor * moistureFactor * tempFactor).toFixed(2));
}

/**
 * Generates financial data if LLM fails or for verification.
 */
function calculateFinancials(cropName, yieldVal, inputs) {
  const data = CROP_DATA[cropName] || { base_price: 2000, cost_per_ha: 25000 };
  
  // Price fluctuation based on random market volatility simulation (±10%)
  const marketPrice = Math.round(data.base_price * (0.9 + Math.random() * 0.2));
  
  // Revenue = Yield (tonnes) * 10 (quintals/ton) * Price/Quintal
  const revenue = Math.round(yieldVal * 10 * marketPrice);
  const cost = data.cost_per_ha;
  const profit = revenue - cost;

  return { marketPrice, revenue, cost, profit };
}

/* ==========================================================================
   3. FALLBACK MECHANISM (The Safety Net)
   ========================================================================== */

/**
 * Generates a full valid response if OpenRouter is down.
 */
const generateFallbackData = (cropList, inputs) => {
  const analysis = cropList.map(crop => {
    const yieldVal = calculateLocalYield(crop, inputs);
    const fin = calculateFinancials(crop, yieldVal, inputs);
    
    return {
      crop: crop,
      market_price_per_quintal: fin.marketPrice,
      expected_yield_t_per_ha: yieldVal,
      expected_revenue_per_ha: fin.revenue,
      input_cost_per_ha: fin.cost,
      expected_profit_per_ha: fin.profit,
      risk_level: fin.profit > 20000 ? "Low" : "Medium",
      market_trend: Math.random() > 0.5 ? "Rising" : "Stable",
      demand_factors: ["Steady local consumption", "Seasonal demand peak"],
      supply_factors: ["Adequate stock in mandis", "Normal sowing area"],
      pest_disease_risk: ["Monitor for aphids", "Root rot risk in high moisture"],
      future_season_forecast: {
        kharif: { recommended: "Yes", reason: "Suitable climate" },
        rabi: { recommended: "No", reason: "Off-season" },
        zaid: { recommended: "Yes", reason: "Short duration profits" }
      },
      auto_yield_t_per_ha: yieldVal // Internal sync
    };
  });

  // Find best crop based on profit
  const best = analysis.reduce((prev, current) => 
    (prev.expected_profit_per_ha > current.expected_profit_per_ha) ? prev : current
  );

  return {
    crop_analysis: analysis,
    best_crop_suggestion: {
      crop: best.crop,
      reason: `Highest projected profit of ₹${best.expected_profit_per_ha} per hectare.`
    }
  };
};

/* ==========================================================================
   4. LLM INTEGRATION
   ========================================================================== */

const buildPrompt = (input) => `
You are a senior Agriculture Economist for India. 
Input Data: ${JSON.stringify(input)}

TASK: Analyze market trends for these crops: ${input.crop_list.join(", ")}.

REQUIREMENTS:
1. "market_price_per_quintal": Use current Indian MSP or Mandi rates.
2. "risk_level": Low, Medium, or High based on volatility.
3. "market_trend": Rising, Stable, or Falling.
4. "future_season_forecast": Logic based on crop rotation.

OUTPUT SCHEMA (JSON ONLY):
{
  "crop_analysis": [
    {
      "crop": "string",
      "market_price_per_quintal": number,
      "risk_level": "string",
      "market_trend": "string",
      "demand_factors": ["string", "string"],
      "supply_factors": ["string", "string"],
      "pest_disease_risk": ["string", "string"],
      "future_season_forecast": {
        "kharif": { "recommended": "Yes/No", "reason": "string" },
        "rabi": { "recommended": "Yes/No", "reason": "string" },
        "zaid": { "recommended": "Yes/No", "reason": "string" }
      }
    }
  ]
}
`;

const extractJSON = (text) => {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.substring(start, end + 1));
  } catch (e) {
    return null;
  }
};

/* ==========================================================================
   5. MAIN CONTROLLER
   ========================================================================== */

export const marketIntelligence = async (req, res) => {
  // 1. Sanitize Inputs
  const rawCrops = Array.isArray(req.body.crops) ? req.body.crops : ["Wheat", "Paddy"];
  const cropList = rawCrops.filter(c => typeof c === 'string' && c.length > 0);
  
  const inputs = {
    n: toNum(req.body.nitrogen),
    p: toNum(req.body.phosphorus),
    k: toNum(req.body.potassium),
    moisture: toNum(req.body.moisture),
    temperature: toNum(req.body.temperature),
    rainfall: toNum(req.body.rainfall),
    state: req.body.state || "India",
    district: req.body.district || "Region",
    crop_list: cropList
  };

  let aiData = null;

  // 2. Try LLM Fetch
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct", // More reliable for JSON than generic free models
        messages: [
          { role: "system", content: "You are a JSON API. Output JSON only." },
          { role: "user", content: buildPrompt(inputs) }
        ],
        temperature: 0.1, // Low temp for consistency
        max_tokens: 1500
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://agrisense.app",
          "X-Title": "AgriSense"
        },
        timeout: 20000 // 20s timeout
      }
    );

    const rawContent = response.data.choices?.[0]?.message?.content;
    aiData = extractJSON(rawContent);

  } catch (err) {
    console.warn("Market Intelligence: LLM Failed, using fallback engine.", err.message);
  }

  // 3. Robust Data Merging (Hybrid Logic)
  try {
    const finalAnalysis = cropList.map(crop => {
      // Get pure math values (Trust this over LLM)
      const localYield = calculateLocalYield(crop, inputs);
      const localFin = calculateFinancials(crop, localYield, inputs);

      // Get AI Qualitative values (Trust this for text/trends)
      const aiCrop = aiData?.crop_analysis?.find(c => 
        c.crop.toLowerCase().includes(crop.toLowerCase())
      ) || {};

      return {
        crop: crop,
        // Prefer AI price if reasonable, else local baseline
        market_price_per_quintal: toNum(aiCrop.market_price_per_quintal) || localFin.marketPrice,
        
        // Always use local logic for Yield calculation (LLMs guess poorly here)
        expected_yield_t_per_ha: localYield,
        auto_yield_t_per_ha: localYield,
        
        // Recalculate financial profit based on the finalized price & yield
        expected_revenue_per_ha: Math.round(localYield * 10 * (toNum(aiCrop.market_price_per_quintal) || localFin.marketPrice)),
        input_cost_per_ha: localFin.cost,
        expected_profit_per_ha: Math.round((localYield * 10 * (toNum(aiCrop.market_price_per_quintal) || localFin.marketPrice)) - localFin.cost),
        
        // Qualitative fields from AI or Fallback
        risk_level: aiCrop.risk_level || (localFin.profit > 15000 ? "Low" : "Medium"),
        market_trend: aiCrop.market_trend || "Stable",
        demand_factors: aiCrop.demand_factors || ["Local demand stable"],
        supply_factors: aiCrop.supply_factors || ["Supply chain normal"],
        pest_disease_risk: aiCrop.pest_disease_risk || ["Standard seasonal risks"],
        future_season_forecast: aiCrop.future_season_forecast || {
          kharif: { recommended: "Check locally", reason: "Data unavailable" },
          rabi: { recommended: "Check locally", reason: "Data unavailable" },
          zaid: { recommended: "Check locally", reason: "Data unavailable" }
        }
      };
    });

    // 4. Determine Best Crop
    const bestCrop = finalAnalysis.reduce((max, c) => 
      c.expected_profit_per_ha > max.expected_profit_per_ha ? c : max, finalAnalysis[0]);

    return res.json({
      source: aiData ? "hybrid_ai_math" : "local_fallback",
      crop_analysis: finalAnalysis,
      best_crop_suggestion: {
        crop: bestCrop.crop,
        reason: `Best projected ROI with ₹${bestCrop.expected_profit_per_ha}/ha profit.`
      }
    });

  } catch (mergeError) {
    console.error("CRITICAL: Merging failed, sending total fallback.", mergeError);
    // 5. Ultimate Safety Net
    return res.json(generateFallbackData(cropList, inputs));
  }
};