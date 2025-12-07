import express from "express";
import { irrigationAdvice } from "../controllers/irrigationController.js";

const router = express.Router();

router.post("/advice", irrigationAdvice);

export default router;
