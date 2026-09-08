import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ScanSearch, Sprout } from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

/** Shown on any results page before the user has analysed a land parcel. */
export function NeedInputCard() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-16 text-center">
      <motion.div
        className="relative mb-6"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <span className="absolute inset-0 -z-10 animate-pulse-ring rounded-3xl bg-forest-300/30" />
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-forest-500 to-forest-800 text-white shadow-lg">
          <ScanSearch className="h-9 w-9" strokeWidth={1.7} />
        </span>
      </motion.div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-600">Nothing analysed yet</p>
      <h2 className="mt-3 font-display text-3xl font-semibold text-forest-950">
        Describe a piece of land to get started
      </h2>
      <p className="mt-3 max-w-md text-slate-500">
        Enter its location, soil, rainfall and budget and GreenVest will return three plantation
        strategies with a live, stress-testable recommendation.
      </p>
      <Link to="/analyze" className="mt-7 text-white">
        <AnimatedButton size="lg">
          <ScanSearch className="h-5 w-5" />
          Analyze My Land
        </AnimatedButton>
      </Link>
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
        <Sprout className="h-4 w-4 text-forest-500" />
        Runs fully on-device with simulated demo data
      </div>
    </div>
  );
}
