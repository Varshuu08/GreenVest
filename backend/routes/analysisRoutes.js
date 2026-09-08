import { Router } from "express";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { evaluateLand, validateAnalysisInput } from "../services/engine.js";

const router = Router();
router.use(requireAuth);

function friendly(error) {
  // friendly wrapper — never leak raw DB messages to users
  console.error("[greenvest]", error?.message || error);
  return { error: "Something went wrong while saving your analysis. Please try again." };
}

// POST /api/analyze-land  -> computes + persists an analysis + strategies
router.post("/analyze-land", async (req, res) => {
  const validation = validateAnalysisInput(req.body || {});
  if (!validation.valid) {
    return res.status(400).json({ error: "Please check your land inputs before analysis.", details: validation.issues });
  }
  if (!isSupabaseConfigured()) {
    return res.status(200).json({
      demo: true,
      ...evaluateLand(req.body || {}),
      analysisId: `demo_${Date.now()}`,
    });
  }
  try {
    const land = req.body;
    const { data: analysis, error: ae } = await supabase
      .from("land_analyses")
      .insert({
        user_id: req.userId,
        location: land.location,
        land_area: land.landArea,
        soil_type: land.soil,
        rainfall: land.rainfall,
        water_availability: land.waterAvailability,
        investment_budget: land.budget,
        investment_goal: land.goal,
      })
      .select()
      .single();
    if (ae) throw ae;

    const result = evaluateLand(land);
    const strategyRows = result.strategies.map((s) => ({
      analysis_id: analysis.id,
      strategy_name: `${s.code}. ${s.name}`,
      description: s.description,
      carbon_estimate: s.carbonEstimate,
      return_estimate: s.financialEstimate,
      water_requirement: s.waterRequirement,
      risk_score: s.riskSensitivityScore,
      resilience_score: s.resilience,
      biodiversity_score: s.biodiversity,
      greenvest_score: s.greenvestScore,
    }));
    await supabase.from("strategies").insert(strategyRows);

    return res.status(201).json({ ...result, analysisId: analysis.id });
  } catch (e) {
    return res.status(500).json(friendly(e));
  }
});

// GET /api/analyses
router.get("/analyses", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("land_analyses")
      .select("*, strategies(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json(friendly(e));
  }
});

// GET /api/analyses/:id (full detail)
router.get("/analyses/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("land_analyses")
      .select("*, strategies(*), zoning_plans(*), scenarios(*)")
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .single();
    if (error || !data) {
      return res.status(404).json({ error: "Analysis not found or you don’t have permission to access it." });
    }
    res.json(data);
  } catch (e) {
    res.status(500).json(friendly(e));
  }
});

// DELETE /api/analyses/:id
router.delete("/analyses/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("land_analyses")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.userId);
    if (error) throw error;
    res.status(204).end();
  } catch (e) {
    res.status(500).json(friendly(e));
  }
});

export default router;
