import { supabase } from "../config/supabase.js";

/**
 * Verifies the Bearer access token's user with the Supabase auth
 * server and attaches the authenticated `userId` to the request.
 * Never trusts a `userId` sent by the client body/query.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing session token." });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired session." });
    }
    req.userId = user.id;
    req.userEmail = user.email;
    next();
  } catch {
    return res.status(401).json({ error: "Could not verify your session. Please sign in again." });
  }
}

// Demo-mode helper: when Supabase is not configured, let the client
// continue against local logic (frontend already carries Demo Mode).
export function demoPrereq() {
  return Boolean(process.env.SUPABASE_URL);
}
