import { motion } from "framer-motion";
import { Fragment } from "react";

const steps = [
  "Reading land geometry",
  "Building scenario carbon estimate",
  "Modelling water-fit index",
  "Building financial scenario",
  "Compiling your strategy",
];

export function LoadingAnimation({ label = "Analyzing your land" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full border-2 border-mint-300/50"
          animate={{ scale: [0.9, 2.2], opacity: [0.8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full border border-forest-300/50"
          animate={{ scale: [0.9, 1.7], opacity: [0.8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
        />
        <motion.div
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-500 to-forest-800 shadow-lg"
          animate={{ rotate: [0, 6, -6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-3xl">🌱</span>
        </motion.div>
      </div>

      <p className="font-display text-lg font-semibold tracking-tight text-forest-950">{label}…</p>

      <div className="mt-5 flex w-full max-w-xs flex-col items-start gap-2 text-left">
        {steps.map((s, i) => (
          <Fragment key={s}>
            <motion.div
              className="flex items-center gap-2 text-xs font-medium text-slate-500"
              initial={{ opacity: 0.25 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: i * 0.55, repeat: steps.length, repeatType: "loop" }}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  i === 0 ? "bg-forest-500" : "bg-mint-300"
                }`}
              />
              {s}
            </motion.div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
