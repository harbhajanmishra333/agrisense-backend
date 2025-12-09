import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import authRoutes from "./routes/authRoutes.js";
import cropRoutes from "./routes/cropRoutes.js";
import irrigationRoutes from "./routes/irrigationRoutes.js";
import soilRoutes from "./routes/soilRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";
import marketDemandRoutes from "./routes/marketDemandRoutes.js";

const app = express();

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// HEALTH CHECK
app.get("/api/ping", (req, res) =>
  res.json({ ok: true, time: Date.now() })
);

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/crop", cropRoutes);
app.use("/api/irrigation", irrigationRoutes);
app.use("/api/soil", soilRoutes);          // ✔ Clean & correct
app.use("/api/market", marketRoutes);      // ✔ Market AI routes


app.use("/api/market/demand", marketDemandRoutes);

// ROOT
app.get("/", (req, res) => {
  res.json({ ok: true, msg: "AgriSense Node backend running" });
});

export default app;
