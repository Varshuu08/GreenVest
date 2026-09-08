import type { Variants } from "framer-motion";

/** Shared premium easing curve */
export const easeOut = [0.22, 1, 0.36, 1] as const;

/** Soft drop-in slide for cards & panels */
export const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
};

/** Gentle fade used for backgrounds and overlays */
export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.7, ease: "easeOut" } },
};

/** Scale + fade for modals and dialogs */
export const pop: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOut },
  },
};

/** Stagger container that distributes `show` to children */
export const stagger = (children = 0.08, delayChildren = 0.05): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: children, delayChildren },
  },
});

/** Height-grow for collapsible content */
export const expand = {
  hidden: { opacity: 0, height: 0 },
  show: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.5, ease: easeOut },
  },
};
