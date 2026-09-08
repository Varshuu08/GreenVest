import { motion } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "dark";
type Size = "md" | "lg" | "sm";

const variants: Record<Variant, string> = {
  primary:
    "text-white bg-gradient-to-br from-forest-600 via-forest-700 to-forest-900 shadow-[0_14px_30px_-12px_rgba(15,65,42,0.7)] hover:shadow-[0_20px_40px_-14px_rgba(15,65,42,0.8)]",
  secondary:
    "text-forest-900 bg-white/85 border border-forest-900/10 shadow-sm backdrop-blur-md hover:bg-white",
  ghost: "text-forest-800 bg-transparent border border-transparent hover:bg-forest-900/5",
  dark: "text-white bg-white/12 border border-white/20 backdrop-blur-md hover:bg-white/20",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-lg gap-1.5",
  md: "px-6 py-3 text-sm rounded-xl gap-2",
  lg: "px-8 py-4 text-base rounded-xl gap-2.5",
};

interface AnimatedButtonProps extends ComponentProps<typeof motion.button> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  animateIcon?: boolean;
}

export function AnimatedButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={cn(
        "group relative inline-flex select-none items-center justify-center font-semibold tracking-tight outline-none transition-colors focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
