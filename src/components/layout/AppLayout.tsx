import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileDrawerContent } from "@/components/layout/MobileNav";

export function AppLayout() {
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f6f8f4]">
      {/* Ambient page background */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -right-40 top-0 h-[520px] w-[520px] rounded-full bg-mint-200/30 blur-3xl" />
        <div className="absolute left-1/4 top-1/2 h-[440px] w-[440px] -translate-y-1/2 rounded-full bg-forest-100/40 blur-3xl" />
        <div className="absolute inset-0 bg-grid opacity-[0.6]" />
      </div>

      {/* Desktop fixed sidebar */}
      <Sidebar />

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-[290px] max-w-[86vw] lg:hidden"
            >
              <button
                onClick={() => setDrawer(false)}
                className="absolute right-3 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <MobileDrawerContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Content column, offset by sidebar width on lg+ */}
      <div className="relative flex min-h-screen flex-col lg:pl-[264px]">
        <TopBar onMenu={() => setDrawer(true)} />

        <main className="relative z-10 mx-auto w-full max-w-[1400px] flex-1 px-4 py-7 sm:px-6 lg:px-8">
          {/* AnimatePresence keyed by route path for page transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
