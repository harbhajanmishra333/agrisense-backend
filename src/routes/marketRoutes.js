import express from "express";

import { enhancedCropRecommendation } from "../controllers/marketRecommendationController.js";
import { forecastPrices } from "../controllers/priceForecastController.js";
import { cropRotationAdvice } from "../controllers/cropRotationController.js";
import { profitCalculator } from "../controllers/profitCalculatorController.js";
import { rankCrops } from "../controllers/cropRankingController.js";
import { recommendCrop } from "../controllers/marketController.js";

const router = express.Router();








router.post("/recommend", recommendCrop);
// Recommend crops based on market demand
router.post("/recommend", enhancedCropRecommendation);

// Price & demand forecast
router.post("/forecast", forecastPrices);

// Crop rotation suggestions
router.post("/rotation", cropRotationAdvice);

// Profit calculator
router.post("/profit", profitCalculator);

// Ranking crops
router.post("/ranking", rankCrops);



export default router;
