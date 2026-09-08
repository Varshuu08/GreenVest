import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CountUp } from "@/components/ui/CountUp";

/**
 * Animated circular progress ring. `value` is 0..scale (default 100).
 * Draws an SVG arc whose stroke length animates when scrolled into view.
 */
export function ScoreRing({
  value,
  scale = 100,
  size = 180,
  stroke = 12,
  label = "GreenVest Score",
  sublabel,
  centerNode,
}: {
  value: number;
  scale?: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  centerNode?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [probe, setProbe] = useState(0);

  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(value, scale) / scale;

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      setProbe(e);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="gv-ring" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1fb782" />
              <stop offset="55%" stopColor="#1f6a41" />
              <stop offset="100%" stopColor="#0d3724" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(14,60,40,0.08)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#gv-ring)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            animate={{ strokeDashoffset: circ * (1 - pct * probe) }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerNode ?? (
            <>
              <span className="font-display text-4xl font-semibold tracking-tight text-forest-950">
                <CountUp value={value} className="tabular-nums" />
                <span className="text-lg text-slate-400">/{scale}</span>
              </span>
              <span className="mt-1 max-w-[7rem] text-[11px] font-medium leading-tight text-slate-500">
                {label}
              </span>
              {sublabel && <span className="mt-0.5 text-[10px] text-slate-400">{sublabel}</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
