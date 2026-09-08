import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Search, Bell, Leaf, Command } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function MobileBrand() {
  return (
    <span className="flex items-center gap-2 lg:hidden">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-forest-500 to-forest-800">
        <Leaf className="h-4.5 w-4.5 text-white" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-forest-950">GreenVest</span>
    </span>
  );
}

/** Hamburger controls shared between mobile drawer & iPad-wide rail. */
export function TopBar({ onMenu }: { onMenu?: () => void }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, signOut, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name.split(" ")[0] || "there";
  const initials = user?.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "GV";
  return (
    <header className="sticky top-0 z-30 border-b border-slate-900/5 bg-[#f6f8f4]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {onMenu && (
          <button
            onClick={onMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-forest-900/5 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <MobileBrand />

        {/* contextual greeting on md+ */}
        <div className="ml-2 hidden md:block">
          <p className="text-sm font-medium text-forest-950">Welcome back, {firstName}</p>
          <p className="text-xs text-slate-400">Let’s see how your land is performing.</p>
        </div>
        {isDemoMode && (
          <span className="hidden rounded-full border border-mint-300/70 bg-mint-100/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-forest-700 md:inline-flex">
            Demo Mode
          </span>
        )}

        {/* authed command search (decorative) */}
        <div className="ml-auto hidden min-w-0 flex-1 justify-end pl-6 sm:flex">
          <button className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-slate-900/5 bg-white/80 px-3 py-2 text-sm text-slate-400 shadow-sm transition-colors hover:border-forest-900/15">
            <Search className="h-4 w-4" />
            <span className="truncate">Search land or projects…</span>
            <span className="ml-auto flex items-center gap-0.5 text-[10px] font-medium text-slate-300">
              <Command className="h-3 w-3" /> K
            </span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:ml-4">
          {/* notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-forest-900/5"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border border-white bg-mint-400" />
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-900/5 bg-white/95 p-2 shadow-xl backdrop-blur"
                >
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Notifications
                  </p>
                  {["Your analysis is ready to review", "New demo data loaded"].map((n) => (
                    <div key={n} className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-forest-50/70">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-forest-500" />
                      <p className="text-sm text-slate-600">{n}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* authenticated profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen((open) => !open)}
              className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-forest-900/5"
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-200 to-emerald-300 text-sm font-bold text-forest-900">
                {initials}
              </span>
              <span className="hidden max-w-36 text-left leading-tight sm:block">
                <span className="block truncate text-sm font-semibold text-forest-950">{user?.name || "GreenVest member"}</span>
                <span className="block truncate text-[11px] text-slate-400">{user?.email}</span>
              </span>
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-900/5 bg-white/95 p-2 shadow-xl backdrop-blur"
                >
                  <div className="border-b border-slate-900/5 px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-forest-950">{user?.name || "GreenVest member"}</p>
                    <p className="truncate text-xs text-slate-400">{user?.email}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await signOut();
                      navigate("/login", { replace: true });
                    }}
                    className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                  >
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

export function MobileClose({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-forest-900/5"
      aria-label="Close menu"
    >
      <X className="h-5 w-5" />
    </button>
  );
}
