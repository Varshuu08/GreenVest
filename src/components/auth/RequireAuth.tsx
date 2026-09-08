import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/** Keeps the decision workspace inaccessible until an email session exists. */
export function RequireAuth() {
  const { isDemoMode, isReady, session, user } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-forest-950 text-sm font-medium text-mint-200">
        Checking authentication...
      </div>
    );
  }

  // A demo workspace is valid only after the visitor explicitly selected it.
  if (isDemoMode && user?.isDemo) return <Outlet />;

  // Real workspace access requires the live Supabase session and confirmed email.
  if (!session || !user || user.isDemo || !user.emailVerified) {
    return <Navigate to="/login" replace state={{ from: location, verificationRequired: Boolean(session && user && !user.emailVerified) }} />;
  }

  return <Outlet />;
}