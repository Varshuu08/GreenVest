import { NavLink } from "react-router-dom";
import { PlayCircle, Leaf } from "lucide-react";
import { cn } from "@/utils/cn";
import { primaryNav, secondaryNav } from "@/data/navigation";
import { useAuth } from "@/context/AuthContext";

export function MobileDrawerContent() {
  const { isDemoMode } = useAuth();
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-forest-950 via-[#07271a] to-[#051a11]">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <span className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-forest-500 to-forest-800">
            <Leaf className="h-5 w-5 text-white" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">GreenVest</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3.5 py-5">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-forest-400/70">
          Workspace
        </p>
        {primaryNav.map((item) => (
          <MobileLink key={item.to} {...item} />
        ))}
        <p className="px-3 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-forest-400/70">
          System
        </p>
        {secondaryNav.map((item) => (
          <MobileLink key={item.to} {...item} />
        ))}
      </nav>

      <div className="border-t border-white/5 px-5 py-4">
        <div className="flex items-center gap-3 rounded-xl bg-mint-300/5 px-3 py-2.5">
          <PlayCircle className="h-5 w-5 text-mint-300" />
          <div className="leading-tight">
            <p className="text-xs font-semibold text-white">{isDemoMode ? "Demo Mode" : "Cloud Sync"}</p>
            <p className="text-[10px] text-forest-300">{isDemoMode ? "Simulated data active" : "Supabase connected"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          isActive ? "bg-white/10 text-white" : "text-forest-200/75 hover:bg-white/5 hover:text-white"
        )
      }
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
      {label}
    </NavLink>
  );
}
