import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { PlayCircle, Leaf } from "lucide-react";
import { cn } from "@/utils/cn";
import { primaryNav, secondaryNav } from "@/data/navigation";
import { useAuth } from "@/context/AuthContext";

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-forest-500 to-forest-800 shadow-[0_8px_20px_-8px_rgba(15,65,42,0.7)]">
        <Leaf className="h-5 w-5 text-white" />
      </span>
      <div className="leading-none">
        <span className="font-display text-lg font-bold tracking-tight text-white">GreenVest</span>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-forest-300">
          Land Intelligence
        </p>
      </div>
    </div>
  );
}

function Item({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <NavLink to={to} className="relative block outline-none">
      {({ isActive }) => (
        <motion.span
          className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
          whileHover={{ x: 3 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          {isActive && (
            <motion.span
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-xl bg-white/10"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <span
            className={cn(
              "relative z-10 flex h-5 items-center",
              isActive ? "text-white" : "text-forest-300 transition-colors group-hover:text-mint-100"
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </span>
          <span
            className={cn(
              "relative z-10 tracking-tight",
              isActive ? "text-white" : "text-forest-200/80 transition-colors group-hover:text-white"
            )}
          >
            {label}
          </span>
          {isActive && (
            <motion.span
              layoutId="sidebar-dot"
              className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-mint-300"
            />
          )}
        </motion.span>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { isDemoMode } = useAuth();
  return (
    <>
      {/* Desktop sidebar (lg+) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-white/5 bg-[#051a11] backdrop-blur lg:flex">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 top-10 h-56 w-56 rounded-full bg-forest-500/20 blur-3xl" />
          <div className="absolute -left-10 bottom-24 h-56 w-56 rounded-full bg-mint-400/10 blur-3xl" />
          <div className="absolute inset-0 bg-grid-faint opacity-40" />
        </div>

        <div className="relative border-b border-white/5 px-6 py-6">
          <Brand />
        </div>

        <div className="relative flex-1 overflow-y-auto px-3.5 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-forest-400/80">
            Workspace
          </p>
          <nav className="space-y-1">
            {primaryNav.map((item) => (
              <Item key={item.to} to={item.to} icon={item.icon} label={item.label} />
            ))}
          </nav>

          <p className="px-3 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-forest-400/80">
            System
          </p>
          <nav className="space-y-1">
            {secondaryNav.map((item) => (
              <Item key={item.to} to={item.to} icon={item.icon} label={item.label} />
            ))}
          </nav>
        </div>

        <div className="relative px-3.5 pb-5">
          <button className="flex w-full items-center gap-3 rounded-xl border border-mint-300/20 bg-mint-300/5 px-3 py-2.5 text-left transition-colors hover:bg-mint-300/10">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-300/15">
              <PlayCircle className="h-4 w-4 text-mint-300" />
            </span>
            <span className="leading-tight">
              <span className="block text-xs font-semibold text-white">{isDemoMode ? "Demo Mode" : "Cloud Sync"}</span>
              <span className="block text-[10px] text-forest-300">{isDemoMode ? "Simulated data active" : "Supabase connected"}</span>
            </span>
            <span className="relative ml-auto flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-300 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint-300" />
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
