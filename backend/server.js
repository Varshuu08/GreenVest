import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import analysisRoutes from "./routes/analysisRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.APP_URL || "*" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, name: "greenvest-api" }));

// ── GreenVest API ───────────────────────────────────────────
app.use("/api", analysisRoutes); // analyze-land, analyses CRUD
app.use("/api", userRoutes); // scenarios, zoning, reports, profile

// graceful 404 + central error handler (no raw stack leaks)
app.use((_req, res) => res.status(404).json({ error: "Route not found." }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[greenvest]", err);
  res.status(500).json({ error: "Something went wrong on our side. Please try again." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🌱 GreenVest API listening on :${PORT}`));
