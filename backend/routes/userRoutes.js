import { Router } from "express";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
router.use(requireAuth);

// POST /api/scenarios — save a scenario against an analysis
router.post("/scenarios", async (req, res) => {
  if (!isSupabaseConfigured()) return res.status(200).json({ demo: true, saved: true });
  try {
    const body = req.body || {};
    const { data, error } = await supabase.from("scenarios").insert({
      analysis_id: body.analysisId,
      scenario_name: body.name,
      budget: body.budget,
      rainfall_change: body.rainfallChange,
      water_change: body.waterChange,
      carbon_price: body.carbonPrice,
      carbon_priority: body.carbonPriority,
      return_priority: body.returnPriority,
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: "Could not save the scenario. Please try again." });
  }
});

// POST /api/zoning — save a zoning configuration
router.post("/zoning", async (req, res) => {
  try {
    const b = req.body || {};
    const { data, error } = await supabase.from("zoning_plans").insert({
      analysis_id: b.analysisId,
      carbon_percentage: b.carbon,
      income_percentage: b.income,
      biodiversity_percentage: b.biodiversity,
      conservation_percentage: b.conservation,
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: "Could not save the zoning plan." });
  }
});

// POST /api/reports — generate + store an investment report
router.post("/reports", async (req, res) => {
  try {
    const b = req.body || {};
    const { data, error } = await supabase.from("reports").insert({
      user_id: req.userId,
      analysis_id: b.analysisId,
      report_name: b.name,
      report_data: b.data,
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: "Report generation failed. Please try again." });
  }
});

// GET /profile — augment auth user with stored profile row
router.get("/profile", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", req.userId)
      .single();
    res.json({ id: req.userId, email: req.userEmail, profile: data || null });
  } catch (e) {
    res.status(500).json({ error: "Could not load your profile." });
  }
});

export default router;
