import express from "express";
import { getMandiPrices } from "../controllers/mandiController.js";

const router = express.Router();

router.get("/price/:crop", getMandiPrices);

export default router;
