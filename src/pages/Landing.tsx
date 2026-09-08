import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Leaf,
  Wind,
  Trees,
  Droplets,
  LineChart,
  ShieldCheck,
  MountainSnow,
  MapPin,
  Star,
  ChevronDown,
  Leaf as LeafAlt,
  Play,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import GuidedDemo from "@/components/GuidedDemo";
import { easeOut, stagger, rise } from "@/lib/variants";

const HERO_IMG =
  "https://images.pexels.com/photos/3127158/pexels-photo-3127158.jpeg?auto=compress&cs=tinysrgb&w=1920";

const word = (i: number) => ({
  hidden: { opacity: 0, y: "110%", rotate: 4 },
  show: {
    opacity: 1,
    y: "0%",
    rotate: 0,
    transition: { duration: 0.8, ease: easeOut, delay: 0.06 * i },
  },
});

const pillars: { icon: LucideIcon; title: string; text: string; accent: string }[] = [
  {
    icon: LineChart,
    title: "Financial Return",
    text: "Compare illustrative financial scenarios using transparent cost and revenue assumptions.",
    accent: "bg-amber-100 text-amber-600",
  },
  {
    icon: Trees,
    title: "Scenario Carbon Estimate",
    text: "Compare modeled long-horizon carbon scenarios; these are not field measurements or credit estimates.",
    accent: "bg-forest-100 text-forest-700",
  },
  {
    icon: Droplets,
    title: "Water Availability",
    text: "Gauge planting load against local rainfall, water tables and seasonal supply.",
    accent: "bg-sky-100 text-sky-600",
  },
  {
    icon: Wind,
    title: "Climate Resilience",
    text: "Stress-test your strategy against drought, flood and shifting weather patterns.",
    accent: "bg-mint-100 text-forest-700",
  },
  {
    icon: MountainSnow,
    title: "Biodiversity",
    text: "Enrich surrounding ecosystems and protect native flora and fauna.",
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: ShieldCheck,
    title: "Investment Risk",
    text: "Balance upside with downside so you invest with clarity and confidence.",
    accent: "bg-violet-100 text-violet-600",
  },
];

const heroMetrics = [
  { k: "25", label: "Acres", icon: MapPin },
  { k: "612", label: "Scenario tCO₂", icon: Trees },
  { k: "₹28L", label: "Scenario finance", icon: LineChart },
  { k: "87", label: "Resilience", icon: ShieldCheck },
];

const flow = [
  { n: "01", t: "Tell us about your land", d: "Location, soil, rainfall, water and budget." },
  { n: "02", t: "Get plantation strategies", d: "Strategies tuned to your land and goals." },
  { n: "03", t: "Stress-test scenarios", d: "Model climate and what-if conditions." },
  { n: "04", t: "Invest with confidence", d: "Receive an explainable AI recommendation." },
];

export default function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <div className="relative bg-white">
      <GuidedDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative min-h-svh overflow-hidden bg-forest-950">
        {/* background photo */}
        <motion.img
          src={HERO_IMG}
          alt="Aerial view of farmland at golden hour"
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/80 via-forest-950/45 to-forest-950/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/70 to-transparent" />
        <div className="absolute inset-0 bg-grid-faint opacity-50" />

        {/* nav */}
        <motion.nav
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8"
        >
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-mint-300 to-forest-500 shadow-lg">
              <Leaf className="h-5 w-5 text-white" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              GreenVest
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-white/75 md:flex">
            <a href="#how" className="transition-colors hover:text-white">How it works</a>
            <a href="#dimensions" className="transition-colors hover:text-white">Dimensions</a>
            <a href="#impact" className="transition-colors hover:text-white">Impact</a>
          </div>

          <div className="flex items-center gap-2 text-white">
            <Link to="/login" className="hidden px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white sm:block">
              Sign in
            </Link>
            <Link to="/signup">
              <AnimatedButton variant="dark" size="sm">
                Create account
                <ArrowRight className="h-4 w-4" />
              </AnimatedButton>
            </Link>
          </div>
        </motion.nav>

        {/* hero content */}
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 pb-24 pt-12 sm:px-8 lg:grid-cols-12 lg:pt-20">
          <div className="lg:col-span-7">
            <motion.div variants={stagger(0.16, 0.1)} initial="hidden" animate="show">
              <motion.p
                variants={rise}
                className="inline-flex items-center gap-2 rounded-full border border-mint-300/25 bg-white/5 px-3 py-1.5 text-xs font-medium text-mint-200 backdrop-blur"
              >
                <span className="flex h-1.5 w-1.5">
                  <span className="absolute h-1.5 w-1.5 animate-ping rounded-full bg-mint-300" />
                  <span className="h-1.5 w-1.5 rounded-full bg-mint-300" />
                </span>
                AI-powered land-to-investment platform
              </motion.p>

              <div
                className="mt-5 font-serif text-[clamp(2.7rem,7vw,5.6rem)] font-medium leading-[1.03] tracking-tight text-white"
                style={{ perspective: 600 }}
              >
                {"Turn Land Into Lasting Impact.".split(" ").map((w, i) => (
                  <span
                    key={w + i}
                    className="mr-[0.28em] inline-block"
                  >
                    <motion.span
                      className="inline-block"
                      variants={word(i)}
                      initial="hidden"
                      animate="show"
                    >
                      {w}
                    </motion.span>
                  </span>
                ))}
              </div>

              <motion.p
                variants={rise}
                className="mt-6 max-w-xl text-lg leading-relaxed text-forest-100/80"
              >
                 Reference-screened plantation planning with transparent scenario estimates for carbon,
                 finance, water and climate sensitivity — before you invest a single rupee.
              </motion.p>

              <motion.div variants={rise} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={() => setDemoOpen(true)}
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-mint-300 to-mint-400 px-8 py-4 text-base font-semibold text-forest-950 shadow-[0_16px_40px_-14px_rgba(31,183,130,0.7)] transition-transform hover:scale-[1.02] sm:w-auto"
                >
                  <span className="absolute -inset-0 opacity-40 blur" />
                  <motion.span className="absolute inline-flex h-12 w-12 rounded-full bg-white/40"
                    animate={{ scale: [0.6, 2.4], opacity: [0.7, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }} />
                  <Play className="h-5 w-5" fill="currentColor" />
                  Start Demo
                </button>
                <Link to="/signup">
                  <AnimatedButton variant="dark" size="lg" className="w-full sm:w-auto">
                    <LeafAlt className="h-5 w-5 text-mint-300" />
                    Explore GreenVest
                  </AnimatedButton>
                </Link>
              </motion.div>

              <motion.div variants={rise} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/60">
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-mint-300 text-mint-300" />
                  Built for climate-first investors
                </span>
                <span className="flex items-center gap-1.5 text-mint-200/70">
                  <ShieldCheck className="h-4 w-4" />
                  Explainable recommendations
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* floating data visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: easeOut }}
            className="relative lg:col-span-5"
          >
            <div className="relative mx-auto w-full max-w-sm">
              {/* main halo card */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="glass-dark rounded-3xl p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-forest-100">Demo Farm Estate</p>
                  <StatusPill />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {heroMetrics.map((m) => (
                    <div key={m.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <m.icon className="h-4 w-4 text-mint-300" />
                      <p className="mt-2 font-display text-2xl font-semibold text-white">{m.k}</p>
                      <p className="text-[11px] text-forest-200/70">{m.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-forest-200/70">
                    <span>Resilience</span>
                    <span className="font-semibold text-mint-300">87%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-mint-400 to-forest-400"
                      initial={{ width: 0 }}
                      animate={{ width: "87%" }}
                      transition={{ duration: 1.6, delay: 1.2, ease: easeOut }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* orbiting chips */}
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="absolute -right-5 top-10 rounded-2xl border border-white/10 bg-forest-900/70 px-4 py-2.5 text-sm backdrop-blur"
              >
                <span className="font-display font-semibold text-white">612 tCO₂</span>
                <span className="ml-2 text-forest-200/70">scenario carbon</span>
              </motion.div>
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
                className="absolute -left-6 bottom-28 rounded-2xl border border-white/10 bg-forest-900/70 px-4 py-2.5 text-sm backdrop-blur"
              >
                <span className="font-display font-semibold text-white">₹28L</span>
                <span className="ml-2 text-forest-200/70">scenario finance</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.a
          href="#how"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-white/60 transition-colors hover:text-white"
        >
          <ChevronDown className="h-7 w-7 animate-bounce" />
        </motion.a>
      </section>

      {/* ───────────────────────── HOW IT WORKS ───────────────────────── */}
      <section id="how" className="relative overflow-hidden bg-white py-24">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div variants={stagger(0.12)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mx-auto max-w-2xl text-center">
            <motion.p variants={rise} className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-600">
              The GreenVest process
            </motion.p>
            <motion.h2 variants={rise} className="mt-3 font-display text-4xl font-semibold tracking-tight text-forest-950">
              Stress-test your land before you invest
            </motion.h2>
            <motion.p variants={rise} className="mt-4 text-lg leading-relaxed text-slate-500">
              A transparent decision path from raw geography to a confident, explainable choice.
            </motion.p>
          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {flow.map((f, i) => (
              <motion.div
                key={f.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: easeOut }}
                className="group relative rounded-2xl border border-slate-900/5 bg-white/80 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-forest-900/10 hover:shadow-xl"
              >
                <span className="font-display text-5xl font-semibold text-forest-200 transition-colors group-hover:text-forest-600">
                  {f.n}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-forest-950">{f.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── DIMENSIONS ───────────────────────── */}
      <section id="dimensions" className="relative overflow-hidden bg-[#f0f4ee] py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-600">
                Six decision dimensions
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-forest-950">
                One balanced view of your land
              </h2>
            </div>
            <p className="max-w-md text-slate-500">
              GreenVest separates reference-based screening from illustrative model outputs, so trade-offs
              are visible before land decisions are made.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.55, delay: (i % 3) * 0.1, ease: easeOut }}
                className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-900/5 backdrop-blur transition-all duration-300 hover:shadow-lg"
              >
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${p.accent}`}>
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-forest-950">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{p.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── IMPACT CTA ───────────────────────── */}
      <section id="impact" className="relative overflow-hidden bg-forest-950 py-24">
        <div className="absolute inset-0 bg-grid-faint opacity-60" />
        <div className="absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-forest-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="font-serif text-4xl font-medium leading-tight text-white md:text-5xl"
          >
            Make money grow on trees —
            <br />
            <span className="text-mint-300">without breaking the land.</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
            className="mt-10"
          >
            <Link to="/signup">
              <AnimatedButton variant="dark" size="lg">
                Start Land Analysis
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </AnimatedButton>
            </Link>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 text-sm text-forest-200/60"
          >
            Interface preview · Simulated demo data · Full engines ship in the next stage
          </motion.p>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-white/5 bg-[#061e16] py-10 text-forest-300/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-sm sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-mint-400" />
            <span className="font-display font-semibold text-white">GreenVest</span>
          </div>
          <p>Simulated demo build · Stress-test your land investment before you invest.</p>
        </div>
      </footer>
    </div>
  );
}

function StatusPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-mint-300/25 bg-mint-300/5 px-2.5 py-1 text-[11px] font-medium text-mint-200">
      <span className="flex h-1.5 w-1.5">
        <span className="absolute h-1.5 w-1.5 animate-ping rounded-full bg-mint-300" />
        <span className="h-1.5 w-1.5 rounded-full bg-mint-300" />
      </span>
      Demo
    </span>
  );
}
