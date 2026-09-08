import {
  LayoutGrid,
  Search,
  Trees,
  Wind,
  FlaskConical,
  Map,
  BadgeCheck,
  Sparkles,
  Settings,
  PlayCircle,
  Archive,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** short label for compact / mobile contexts */
  short?: string;
}

export const primaryNav: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutGrid, short: "Home" },
  { label: "Analyze Land", to: "/analyze", icon: Search, short: "Analyze" },
  { label: "Strategies", to: "/strategies", icon: Trees, short: "Strategy" },
  { label: "Stress Test", to: "/stress-test", icon: Wind, short: "Stress" },
  { label: "Scenario Simulator", to: "/simulator", icon: FlaskConical, short: "Simulator" },
  { label: "Land Zoning", to: "/zoning", icon: Map, short: "Zoning" },
  { label: "Recommendation", to: "/recommendation", icon: BadgeCheck, short: "Reco" },
  { label: "AI Advisor", to: "/ai-advisor", icon: Sparkles, short: "Advisor" },
];

export const secondaryNav: NavItem[] = [
  { label: "My Analyses", to: "/analyses", icon: Archive, short: "History" },
  { label: "Settings", to: "/settings", icon: Settings },
];

export const brandMeta = {
  name: "GreenVest",
  demoMode: true,
  demoLabel: "Demo Mode",
  demoIcon: PlayCircle,
};
