import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import cropRoutes from "./routes/cropRoutes.js";
import irrigationRoutes from "./routes/irrigationRoutes.js";





import soilRoutes from "./routes/soilRoutes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Health check route
app.get("/api/ping", (req, res) => res.json({ ok: true, time: Date.now() }));

// API Route Mounting
app.use("/api/auth", authRoutes);
app.use("/api/crop", cropRoutes);

app.use("/api/soil-irrigation", soilRoutes);
// ⭐ IMPORTANT: Mount soil + irrigation routes
app.use("/api", soilRoutes);

app.use("/api/irrigation", irrigationRoutes);




// Default root
app.get("/", (req, res) => {
  res.json({ ok: true, msg: "AgriSense Node backend running" });
});

export default app;
