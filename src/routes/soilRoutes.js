import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import { analyzeSoilAndIrrigation } from "../controllers/soilIrrigationController.js";

const router = express.Router();

// multer storage to 'uploads' folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
  dest: path.join(__dirname, "../../uploads/"),
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// POST /api/soil-irrigation
router.post("/soil-irrigation", upload.single("soilImage"), analyzeSoilAndIrrigation);

export default router;
