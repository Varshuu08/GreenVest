import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Leaf, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAuth } from "@/context/AuthContext";

export default function ResetPasswordPage() {
  const { isReady, isRecoverySession, signOut, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    setError("");
    setSaving(true);
    const result = await updatePassword(password);
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSuccess(result.message);
    setPassword("");
    setConfirmPassword("");
  }

  async function continueToSignIn() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-forest-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 top-0 h-96 w-96 rounded-full bg-forest-500/25 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 h-80 w-80 rounded-full bg-mint-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-grid-faint opacity-60" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="max-w-lg">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-mint-300 to-forest-500 shadow-lg"><Leaf className="h-5 w-5 text-white" /></span>
              <span className="font-display text-xl font-bold tracking-tight text-white">GreenVest</span>
            </Link>
            <Link to="/login" className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-forest-100 transition-colors hover:bg-white/10 hover:text-white"><ArrowLeft className="h-4 w-4" /> Sign in</Link>
          </div>
          <p className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-mint-300">Account recovery</p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight text-white sm:text-5xl">Set a new password.</h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-forest-100/75">Choose a new password for your verified GreenVest account. This page is available only through a valid password recovery link.</p>
          <div className="mt-8 space-y-4 border-l border-mint-300/25 pl-4 text-sm text-forest-100/80">
            {[
              "Password updates are handled by Supabase Auth",
              "Your new password is never stored in this application",
              "The recovery link expires according to your Supabase Auth settings",
            ].map((item, index) => (
              <motion.p key={item} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + index * 0.08 }} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-mint-300" /> {item}</motion.p>
            ))}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {!isReady ? (
            <p className="py-12 text-center text-sm text-forest-100">Checking your password reset link...</p>
          ) : success ? (
            <div className="py-5 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-300/10 text-mint-200"><CheckCircle2 className="h-7 w-7" /></span>
              <h2 className="mt-5 font-display text-2xl font-semibold text-white">Password updated successfully.</h2>
              <p className="mt-3 text-sm leading-relaxed text-forest-200/70">Use your new password the next time you sign in.</p>
              <AnimatedButton onClick={() => void continueToSignIn()} variant="primary" size="lg" className="mt-6 w-full">Continue to Sign In <ArrowRight className="h-5 w-5" /></AnimatedButton>
            </div>
          ) : !isRecoverySession ? (
            <div className="py-5 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-100"><Mail className="h-7 w-7" /></span>
              <h2 className="mt-5 font-display text-2xl font-semibold text-white">Reset link unavailable.</h2>
              <p className="mt-3 text-sm leading-relaxed text-forest-200/70">This password reset link is invalid or expired. Request a new link and try again.</p>
              <Link to="/forgot-password" className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-br from-forest-600 via-forest-700 to-forest-900 px-8 py-4 text-base font-semibold text-white shadow-[0_14px_30px_-12px_rgba(15,65,42,0.7)] transition-transform hover:scale-[1.02]">Request a new reset link <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-300/10 text-mint-200"><LockKeyhole className="h-5 w-5" /></span>
                <div><h2 className="font-display text-xl font-semibold text-white">Create a new password</h2><p className="text-sm text-forest-200/70">Use at least 8 characters.</p></div>
              </div>
              <form onSubmit={submit} className="mt-7 space-y-5">
                <PasswordField label="New Password" value={password} onChange={setPassword} autoComplete="new-password" />
                <PasswordField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
                {error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{error}</motion.p>}
                <AnimatedButton type="submit" variant="primary" size="lg" disabled={saving} className="w-full">{saving ? "Updating Password..." : "Update Password"} <ArrowRight className="h-5 w-5" /></AnimatedButton>
              </form>
            </>
          )}
          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-forest-200/55"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint-300/70" /> Supabase Auth manages account recovery and password updates. GreenVest never stores password data.</p>
        </motion.section>
      </div>
    </main>
  );
}

function PasswordField({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-forest-100">{label}</span>
      <div className="relative"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mint-300" /><input value={value} onChange={(event) => onChange(event.target.value)} className="auth-input" type="password" placeholder="At least 8 characters" autoComplete={autoComplete} minLength={8} required /></div>
    </label>
  );
}