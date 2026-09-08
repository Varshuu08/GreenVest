import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import type { ReactNode } from "react";
import { rise } from "@/lib/variants";

/** Wraps children so they fade + slide into view on scroll. */
export function Reveal({
  children,
  variants = rise,
  className,
  amount = 0.2,
}: {
  children: ReactNode;
  variants?: Variants;
  className?: string;
  amount?: number;
}) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
