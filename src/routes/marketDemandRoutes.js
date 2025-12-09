import express from "express";
import { marketDemand } from "../controllers/marketDemandController.js";

const router = express.Router();

router.post("/predict", marketDemand);

export default router;
