import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Leaf, Mail, ShieldCheck, TriangleAlert } from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallbackPage() {
  const { completeAuthCallback } = useAuth();
  const navigate = useNavigate();
  const started = useRef(false);
  const [state, setState] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function verify() {
      const result = await completeAuthCallback();
      if (!result.ok) {
        setState("error");
        setMessage(result.message);
        return;
      }
      setState("success");
      setMessage(result.message);
      window.setTimeout(() => navigate("/dashboard", { replace: true }), 900);
    }

    void verify();
  }, [completeAuthCallback, navigate]);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-forest-950 px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 top-0 h-96 w-96 rounded-full bg-forest-500/25 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 h-80 w-80 rounded-full bg-mint-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-grid-faint opacity-60" />
      </div>
      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.07] p-7 text-center shadow-2xl backdrop-blur-xl sm:p-9"
      >
        <Link to="/" className="inline-flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-mint-300 to-forest-500 shadow-lg"><Leaf className="h-5 w-5 text-white" /></span>
          <span className="font-display text-xl font-bold tracking-tight text-white">GreenVest</span>
        </Link>

        <motion.span
          animate={state === "verifying" ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 1.4, repeat: state === "verifying" ? Infinity : 0 }}
          className={`mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-2xl ${state === "error" ? "bg-amber-300/10 text-amber-100" : "bg-mint-300/10 text-mint-200"}`}
        >
          {state === "verifying" ? <Mail className="h-8 w-8" /> : state === "success" ? <CheckCircle2 className="h-8 w-8" /> : <TriangleAlert className="h-8 w-8" />}
        </motion.span>

        <h1 className="mt-6 font-display text-2xl font-semibold text-white">
          {state === "verifying" ? "Verifying your email..." : state === "success" ? "Email verified" : "Verification unavailable"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-forest-100/75">{message}</p>

        {state === "verifying" && <div className="mx-auto mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-mint-300" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }} /></div>}
        {state === "success" && <p className="mt-5 text-sm font-medium text-mint-200">Redirecting to your dashboard...</p>}
        {state === "error" && (
          <div className="mt-7 space-y-3">
            <Link to="/login" className="block"><AnimatedButton variant="primary" size="lg" className="w-full">Back to Sign In <ArrowRight className="h-5 w-5" /></AnimatedButton></Link>
            <p className="flex items-start gap-2 text-left text-xs leading-relaxed text-forest-200/55"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint-300/70" /> No password or verification token is stored by GreenVest.</p>
          </div>
        )}
      </motion.section>
    </main>
  );
}