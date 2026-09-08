import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Leaf,
  MapPin,
  Layers,
  CloudRain,
  Droplets,
  Wallet,
  Trees,
  Wind,
} from "lucide-react";

const STEPS = [
  { icon: MapPin, label: "Reading land conditions" },
  { icon: Layers, label: "Applying reference-based soil screening" },
  { icon: CloudRain, label: "Applying rainfall scenario input" },
  { icon: Droplets, label: "Checking modeled water-fit index" },
  { icon: Wallet, label: "Applying investment scenario assumptions" },
  { icon: Trees, label: "Generating scenario strategies" },
  { icon: Wind, label: "Applying illustrative stress assumptions" },
];

export function AnalysisLoader({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(0);
  const cb = useRef(onDone);
  cb.current = onDone;

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDone(i);
      if (i >= STEPS.length) {
        clearInterval(id);
        window.setTimeout(() => cb.current(), 700);
      }
    }, 640);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative mb-8 flex h-20 w-20 items-center justify-center">
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full border-2 border-mint-300/60"
          animate={{ scale: [1, 2.1], opacity: [0.8, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full border border-forest-300/50"
          animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut", delay: 0.35 }}
        />
        <motion.div
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-500 to-forest-800 shadow-lg"
          animate={{ rotate: [0, 4, -4, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Leaf className="h-7 w-7 text-white" />
        </motion.div>
      </div>

      <div className="w-full max-w-sm space-y-2">
        {STEPS.map((s, idx) => {
          const complete = idx < done;
          const active = idx === done;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: complete || active ? 1 : 0.25, y: 0 }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                active
                  ? "bg-forest-900/[0.04]"
                  : complete
                    ? "text-forest-800"
                    : "text-slate-400"
              }`}
              style={{ height: 40 }}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  complete
                    ? "bg-gradient-to-br from-mint-300 to-mint-400 text-forest-950"
                    : "bg-forest-900/5 text-forest-600"
                }`}
              >
                {complete ? <Check className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
              </span>
              <span className={`flex-1 truncate ${active ? "animate-pulse font-medium" : "font-medium"}`}>
                {s.label}
              </span>
              {active && (
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-forest-500"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
