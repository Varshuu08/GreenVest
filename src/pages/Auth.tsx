import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Leaf, LockKeyhole, Mail, ShieldCheck, Sprout } from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAuth } from "@/context/AuthContext";

type Mode = "login" | "signup" | "forgot";

export function SignInPage() {
  return <AuthPage mode="login" />;
}

export function SignUpPage() {
  return <AuthPage mode="signup" />;
}

export function ForgotPasswordPage() {
  return <AuthPage mode="forgot" />;
}

function AuthPage({ mode }: { mode: Mode }) {
  const {
    connectionError,
    enterDemoMode,
    isAuthenticated,
    isDemoMode,
    resendVerification,
    sendPasswordReset,
    signIn,
    signUp,
    verificationEmail,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/dashboard";
  const [email, setEmail] = useState(verificationEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [verificationPending, setVerificationPending] = useState(Boolean(verificationEmail));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (verificationEmail) {
      setEmail(verificationEmail);
      setVerificationPending(true);
    }
  }, [verificationEmail]);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";
  const accessEmail = verificationEmail || email;
  const copy = isForgot
    ? { eyebrow: "Account recovery", title: "Reset your GreenVest password.", body: "Enter your account email and we’ll send a password reset link.", submit: "Send Reset Link" }
    : isSignup
      ? { eyebrow: "Create your workspace", title: "Build your land intelligence workspace.", body: "Create a GreenVest account with your email and password. Verify your email before entering your workspace.", submit: "Create Account" }
      : { eyebrow: "Welcome back", title: "Continue your land investment story.", body: "Sign in with your verified GreenVest email and password to reopen your workspace.", submit: "Sign In" };

  function emailIsValid(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function clearMessages() {
    setError("");
    setNotice("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailIsValid(normalizedEmail)) {
      setError("Enter a valid email address to continue.");
      return;
    }
    if (isSignup && !name.trim()) {
      setError("Enter your full name to create an account.");
      return;
    }
    if (!isForgot && password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    clearMessages();
    setSubmitting(true);
    const result = isForgot
      ? await sendPasswordReset(normalizedEmail)
      : isSignup
        ? await signUp(normalizedEmail, password, name)
        : await signIn(normalizedEmail, password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      if (result.status === "verification-required") setVerificationPending(true);
      return;
    }
    if (result.status === "authenticated") {
      navigate(from, { replace: true });
      return;
    }
    if (result.status === "verification-required") {
      setEmail(result.email || normalizedEmail);
      setVerificationPending(true);
      return;
    }
    setNotice(result.message);
  }

  async function resend() {
    if (!emailIsValid(accessEmail)) {
      setError("Enter the email address you used to create your account.");
      return;
    }
    clearMessages();
    setResending(true);
    const result = await resendVerification(accessEmail);
    setResending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setNotice(result.message);
  }

  async function useDemo() {
    await enterDemoMode();
    navigate("/dashboard", { replace: true });
  }

  return (
    <AuthShell eyebrow={copy.eyebrow} title={copy.title} body={copy.body} isDemoMode={isDemoMode}>
      {verificationPending ? (
        <VerificationPanel email={accessEmail} error={error} notice={notice} loading={resending} onResend={() => void resend()} onDemo={() => void useDemo()} />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-300/10 text-mint-200">
              {isSignup ? <Sprout className="h-5 w-5" /> : isForgot ? <LockKeyhole className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-white">{isSignup ? "Create your account" : isForgot ? "Password recovery" : "Sign in"}</h2>
              <p className="text-sm text-forest-200/70">{isDemoMode ? "Demo Mode is active only when you explicitly choose it." : "Supabase securely manages your password and session."}</p>
            </div>
          </div>

          {connectionError && <Message tone="error">{connectionError}</Message>}

          <form onSubmit={submit} className="mt-7 space-y-5">
            {isSignup && (
              <Field label="Full Name" icon={Sprout}>
                <input value={name} onChange={(event) => { setName(event.target.value); clearMessages(); }} className="auth-input" placeholder="Aarav Kumar" autoComplete="name" required />
              </Field>
            )}

            <Field label="Email address" icon={Mail}>
              <input value={email} onChange={(event) => { setEmail(event.target.value); clearMessages(); }} className="auth-input" type="email" placeholder="you@example.com" autoComplete="email" autoFocus={!isSignup} required />
            </Field>

            {!isForgot && (
              <>
                <Field label="Password" icon={LockKeyhole}>
                  <input value={password} onChange={(event) => { setPassword(event.target.value); clearMessages(); }} className="auth-input" type="password" placeholder={isSignup ? "At least 8 characters" : "Your password"} autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} required />
                </Field>
                {isSignup && (
                  <Field label="Confirm Password" icon={LockKeyhole}>
                    <input value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); clearMessages(); }} className="auth-input" type="password" placeholder="Repeat your password" autoComplete="new-password" minLength={8} required />
                  </Field>
                )}
              </>
            )}

            {error && <Message tone="error">{error}</Message>}
            {notice && <Message tone="success">{notice}</Message>}

            <AnimatedButton type="submit" variant="primary" size="lg" disabled={submitting} className="w-full">
              {submitting ? isSignup ? "Creating Account..." : isForgot ? "Sending Reset Link..." : "Signing In..." : copy.submit}
              <ArrowRight className="h-5 w-5" />
            </AnimatedButton>
          </form>

          {!isSignup && !isForgot && <Link to="/forgot-password" className="mt-4 inline-block text-sm font-semibold text-mint-200 hover:text-white">Forgot Password?</Link>}

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5 text-sm">
            {isForgot ? (
              <Link to="/login" className="font-semibold text-mint-200 hover:text-white">Back to Sign In</Link>
            ) : (
              <>
                <span className="text-forest-200/70">{isSignup ? "Already have an account?" : "New to GreenVest?"}</span>
                <Link to={isSignup ? "/login" : "/signup"} className="font-semibold text-mint-200 hover:text-white">{isSignup ? "Sign in" : "Create an account"}</Link>
              </>
            )}
          </div>

          <button onClick={() => void useDemo()} type="button" className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-forest-100 transition-colors hover:bg-white/10 hover:text-white">
            Explore Demo Mode
          </button>
        </>
      )}
    </AuthShell>
  );
}

function AuthShell({ eyebrow, title, body, isDemoMode, children }: { eyebrow: string; title: string; body: string; isDemoMode: boolean; children: React.ReactNode }) {
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
            <Link to="/" className="inline-flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-mint-300 to-forest-500 shadow-lg"><Leaf className="h-5 w-5 text-white" /></span><span className="font-display text-xl font-bold tracking-tight text-white">GreenVest</span></Link>
            <Link to="/" className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-forest-100 transition-colors hover:bg-white/10 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to website</Link>
          </div>
          <p className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-mint-300">{eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight text-white sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-forest-100/75">{body}</p>
          <div className="mt-8 space-y-4 border-l border-mint-300/25 pl-4 text-sm text-forest-100/80">
            {["Email verification protects access to your workspace", "Supabase securely manages passwords and persistent sessions", isDemoMode ? "An explicit Demo Mode session is currently active" : "Demo Mode is available only when you choose it"].map((item, index) => (
              <motion.p key={item} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + index * 0.08 }} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-mint-300" /> {item}</motion.p>
            ))}
          </div>
        </motion.section>
        <motion.section initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {children}
          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-forest-200/55"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint-300/70" /> GreenVest never stores your password. Supabase Auth manages real accounts; Demo Mode is a separate, explicitly selected local experience.</p>
        </motion.section>
      </div>
    </main>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-forest-100">{label}</span><div className="relative"><Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mint-300" />{children}</div></label>;
}

function Message({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const classes = tone === "error" ? "border-amber-300/30 bg-amber-300/10 text-amber-100" : "border-mint-300/30 bg-mint-300/10 text-mint-100";
  return <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border px-3 py-2 text-sm ${classes}`}>{children}</motion.p>;
}

function VerificationPanel({ email, error, notice, loading, onResend, onDemo }: { email: string; error: string; notice: string; loading: boolean; onResend: () => void; onDemo: () => void }) {
  return (
    <div className="text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-300/10 text-mint-200"><Mail className="h-7 w-7" /></span>
      <h2 className="mt-5 font-display text-2xl font-semibold text-white">Check your email</h2>
      <p className="mt-3 text-sm leading-relaxed text-forest-200/75">We’ve sent a verification link to:</p>
      <p className="mt-1 break-all font-semibold text-mint-200">{email}</p>
      <p className="mt-4 text-sm leading-relaxed text-forest-200/70">Please verify your email before signing in to GreenVest.</p>
      {error && <div className="mt-5"><Message tone="error">{error}</Message></div>}
      {notice && <div className="mt-5"><Message tone="success">{notice}</Message></div>}
      <AnimatedButton onClick={onResend} variant="primary" size="lg" disabled={loading} className="mt-6 w-full">{loading ? "Sending verification email..." : "Resend verification email"}</AnimatedButton>
      <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-mint-200 hover:text-white">Back to Sign In</Link>
      <button onClick={onDemo} type="button" className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-forest-100 transition-colors hover:bg-white/10 hover:text-white">Explore Demo Mode instead</button>
    </div>
  );
}