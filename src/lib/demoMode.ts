export const DEMO_SESSION_KEY = "greenvest.explicit-demo-session.v1";

export interface DemoSessionUser {
  id: string;
  email: string;
  name: string;
  isDemo: true;
  emailVerified: true;
}

export function readDemoSession(): DemoSessionUser | null {
  try {
    const raw = window.localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoSessionUser;
    return parsed.isDemo ? parsed : null;
  } catch {
    window.localStorage.removeItem(DEMO_SESSION_KEY);
    return null;
  }
}

export function writeDemoSession(user: Omit<DemoSessionUser, "isDemo" | "emailVerified">) {
  window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ ...user, isDemo: true, emailVerified: true }));
}

export function clearDemoSession() {
  window.localStorage.removeItem(DEMO_SESSION_KEY);
}

export function isExplicitDemoMode() {
  return Boolean(readDemoSession());
}