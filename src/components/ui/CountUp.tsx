import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

/**
 * Animates a number from 0 to `value` when it scrolls into view.
 * Pure UI — accepts a formatted string via `format`.
 */
export function CountUp({
  value,
  decimals = 0,
  duration = 1.6,
  format,
  className,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(format ? format(0) : (0).toFixed(decimals));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(format ? format(v) : v.toFixed(decimals)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
