import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Public/admin client used by the API. Service role is only ever
// read from the server environment — never shipped to the frontend.
export const supabase = createClient(
  url,
  serviceKey || anonKey, // fallback only when no service key is configured
  serviceKey ? { auth: { autoRefreshToken: false, persistSession: false } } : undefined
);

export function isSupabaseConfigured() {
  return Boolean(url && (anonKey || serviceKey));
}
