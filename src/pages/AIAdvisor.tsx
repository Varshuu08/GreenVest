import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Trees, MapPin, Droplets, Gauge } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSimulation } from "@/context/SimulationContext";
import { askAdvisor, SUGGESTED_QUESTIONS } from "@/logic/advisor";
import type { AdvisorMessage } from "@/logic/types";

export default function AIAdvisorPage() {
  const sim = useSimulation();
  const [msgs, setMsgs] = useState<AdvisorMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    setMsgs([
      {
        id: "boot",
        role: "ai",
        text: sim.analyzed
          ? `I'm tracking your ${sim.active?.name} plan across the "${sim.scenario.name}" scenario. Ask about the reference screening, model assumptions, scenario carbon, scenario finance, water fit or trade-offs.`
          : "Analyse a piece of land first and I'll answer with data tied to that exact plot.",
      },
    ]);
  }, [sim]);

  function snapshot(s: typeof sim) {
    return {
      land: s.land,
      active: s.active,
      outcome: s.outcome,
      strategies: s.strategies,
      scenarioName: s.scenario.name,
      worstOn: s.worseOn,
    };
  }

  function ask(q: string) {
    const clean = q.trim();
    if (!clean || thinking) return;
    setMsgs((m) => [...m, { id: `${Date.now()}-u`, role: "user", text: clean }]);
    setInput("");
    setThinking(true);
    window.setTimeout(() => {
      const reply = askAdvisor(snapshot(sim), clean);
      setMsgs((m) => [...m, { id: `${Date.now()}-a`, role: "ai", text: reply }]);
      setThinking(false);
    }, 950);
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs, thinking]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        icon={Sparkles}
        eyebrow="GreenVest AI"
        title="AI Advisor"
        description="Ask about the current land inputs, reference screening and scenario assumptions. The advisor explains live model values without treating them as measured outcomes."
      />

      {/* active context strip */}
      <GlassCard className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl sm:grid-cols-4" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
        {[
          { Icon: MapPin, k: sim.land.location.split(",")[0] + " land", v: sim.analyzed ? `${sim.land.area} acres` : "—" },
          { Icon: Trees, k: "Strategy", v: sim.analyzed ? `${sim.active?.code}. ${sim.active?.name}` : "—" },
          { Icon: Droplets, k: "Scenario", v: sim.analyzed ? `${sim.scenario.name}${sim.worseOn ? " • worst" : ""}` : "—" },
          { Icon: Gauge, k: "Score", v: sim.analyzed ? `${sim.outcome?.total ?? sim.active?.metrics.total}/100` : "—" },
        ].map((c) => (
          <div key={c.k} className="flex items-center gap-2.5 bg-white/70 px-4 py-3">
            <c.Icon className="h-4 w-4 shrink-0 text-forest-600" />
            <div className="min-w-0">
              <p className="truncate text-[11px] text-slate-400">{c.k}</p>
              <p className="truncate text-sm font-semibold text-forest-950">{c.v}</p>
            </div>
          </div>
        ))}
      </GlassCard>

      <GlassCard className="flex min-h-[420px] flex-col overflow-hidden p-0" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between border-b border-slate-900/5 px-5 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-forest-950">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-forest-500 to-forest-800 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            GreenVest AI
          </span>
          <StatusBadge tone="slate">Reference + scenario explainer</StatusBadge>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" style={{ maxHeight: 340 }}>
          <AnimatePresence initial={false}>
            {msgs.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] rounded-2xl rounded-tr-md bg-gradient-to-br from-forest-600 to-forest-800 px-4 py-2.5 text-sm text-white shadow-md"
                      : "max-w-[86%] rounded-2xl rounded-tl-md border border-slate-900/5 bg-forest-50/70 px-4 py-2.5 text-sm leading-relaxed text-forest-950"
                  }
                >
                  {m.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {thinking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-900/5 bg-forest-50/70 px-4 py-3">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-forest-500"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                    />
                  ))}
                </span>
                <span className="text-xs text-slate-400">Reviewing land inputs and scenario assumptions…</span>
              </div>
            </motion.div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-slate-900/5 p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                className="rounded-full border border-forest-900/10 bg-white px-2.5 py-1 text-xs text-forest-700 transition-colors hover:border-forest-600 hover:bg-forest-600 hover:text-white"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your land, strategy or climate risk…"
              className="input"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-700 text-white transition-colors hover:bg-forest-800 disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}
