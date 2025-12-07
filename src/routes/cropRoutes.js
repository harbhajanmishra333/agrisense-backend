import express from "express";
import { predictCrop } from "../controllers/cropController.js";

const router = express.Router();

router.post("/predict", predictCrop);

export default router;
