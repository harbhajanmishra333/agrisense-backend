import express from "express";
import { hybridRecommend } from "../controllers/hybridController.js";

const router = express.Router();

// Hybrid Fertilizer + Pest recommendation
router.post("/recommend", hybridRecommend);

export default router;
