import express from "express";
import { marketIntelligence } from "../controllers/marketController.js";

const router = express.Router();

router.post("/intelligence", marketIntelligence);

export default router;
