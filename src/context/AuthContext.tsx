import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import {
  clearDemoSession,
  readDemoSession,
  writeDemoSession,
} from "@/lib/demoMode";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  isDemo: boolean;
  emailVerified: boolean;
}

export type AuthResultStatus =
  | "authenticated"
  | "verification-required"
  | "sent"
  | "updated"
  | "error";

export interface AuthResult {
  ok: boolean;
  status: AuthResultStatus;
  message: string;
  email?: string;
}

interface AuthApi {
  user: AppUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isReady: boolean;
  isDemoMode: boolean;
  isSupabaseConfigured: boolean;
  verificationEmail: string | null;
  connectionError: string | null;
  isRecoverySession: boolean;

  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<AuthResult>;

  signIn: (
    email: string,
    password: string
  ) => Promise<AuthResult>;

  resendVerification: (
    email: string
  ) => Promise<AuthResult>;

  completeAuthCallback: () => Promise<AuthResult>;

  sendPasswordReset: (
    email: string
  ) => Promise<AuthResult>;

  updatePassword: (
    password: string
  ) => Promise<AuthResult>;

  enterDemoMode: () => Promise<void>;

  updateProfile: (
    name: string
  ) => Promise<boolean>;

  signOut: () => Promise<void>;
}

const RECOVERY_KEY = "greenvest.password-recovery.v1";

const AuthContext = createContext<AuthApi | null>(null);

function nameFromEmail(email: string) {
  const local = email.split("@")[0] || "GreenVest member";

  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ");
}

function isVerified(user: User) {
  return Boolean(user.email_confirmed_at);
}

function toAppUser(
  user: User,
  profileName?: string | null
): AppUser {
  const email =
    user.email || "member@greenvest.app";

  const metadataName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : "";

  return {
    id: user.id,
    email,
    name:
      profileName ||
      metadataName ||
      nameFromEmail(email),
    isDemo: false,
    emailVerified: isVerified(user),
  };
}

function friendlyAuthError(
  message: string,
  action:
    | "signup"
    | "signin"
    | "resend"
    | "reset"
    | "update"
) {
  const normalized = message.toLowerCase();

  if (
    /invalid login credentials|invalid credentials/.test(
      normalized
    )
  ) {
    return "Incorrect email or password.";
  }

  if (
    /email not confirmed|email.*confirm/.test(
      normalized
    )
  ) {
    return "Please verify your email before accessing GreenVest.";
  }

  if (
    /already registered|already exists|user already/.test(
      normalized
    )
  ) {
    return "An account with this email already exists. Try signing in.";
  }

  if (
    /password.*least|password.*short|weak password/.test(
      normalized
    )
  ) {
    return "Use a stronger password with at least 8 characters.";
  }

  if (
    /network|failed to fetch|fetch failed|timeout|connection/.test(
      normalized
    )
  ) {
    return "Unable to connect. Please check your internet connection and try again.";
  }

  if (action === "resend") {
    return "Unable to resend the verification email. Please try again.";
  }

  if (action === "reset") {
    return "Unable to send the password reset email. Please try again.";
  }

  if (action === "update") {
    return "Unable to update your password. Please request a new reset link and try again.";
  }

  return action === "signup"
    ? "Unable to create your account. Please try again."
    : "Unable to sign in. Please try again.";
}

async function profileNameFor(user: User) {
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    return data?.full_name || null;
  } catch {
    return null;
  }
}

function readRecoveryState() {
  try {
    return (
      window.sessionStorage.getItem(
        RECOVERY_KEY
      ) === "true" ||
      window.location.hash.includes(
        "type=recovery"
      )
    );
  } catch {
    return false;
  }
}

function writeRecoveryState(active: boolean) {
  try {
    if (active) {
      window.sessionStorage.setItem(
        RECOVERY_KEY,
        "true"
      );
    } else {
      window.sessionStorage.removeItem(
        RECOVERY_KEY
      );
    }
  } catch {
    // Supabase recovery session remains the source of truth.
  }
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AppUser | null>(null);

  const [session, setSession] =
    useState<Session | null>(null);

  const [isReady, setIsReady] =
    useState(false);

  const [verificationEmail, setVerificationEmail] =
    useState<string | null>(null);

  const [connectionError, setConnectionError] =
    useState<string | null>(null);

  const [isRecoverySession, setIsRecoverySession] =
    useState(false);

  function setRealSession(
    nextSession: Session | null,
    _event?: AuthChangeEvent
  ) {
    setSession(nextSession);

    if (!nextSession?.user) {
      setUser(null);
      return;
    }

    const nextUser = toAppUser(
      nextSession.user
    );

    if (!nextUser.emailVerified) {
      setUser(null);
      setVerificationEmail(
        nextUser.email
      );
      return;
    }

    setVerificationEmail(null);
    setUser(nextUser);

    window.setTimeout(() => {
      void profileNameFor(
        nextSession.user
      ).then((profileName) => {
        if (profileName) {
          setUser(
            toAppUser(
              nextSession.user,
              profileName
            )
          );
        }
      });
    }, 0);
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const demoUser = readDemoSession();

      if (demoUser) {
        if (active) {
          setSession(null);
          setUser(demoUser);
          setIsReady(true);
        }

        return;
      }

      if (!supabase) {
        if (active) {
          setConnectionError(
            "Supabase authentication is not configured. Sign in is unavailable until public environment variables are set."
          );

          setIsReady(true);
        }

        return;
      }

      try {
        const {
          data,
          error,
        } = await supabase.auth.getSession();

        if (!active) return;

        if (error) {
          setConnectionError(
            "Unable to check your authentication session. Please refresh and try again."
          );
        } else {
          setRealSession(
            data.session,
            "INITIAL_SESSION"
          );

          setIsRecoverySession(
            readRecoveryState()
          );
        }
      } catch {
        if (active) {
          setConnectionError(
            "Unable to connect to authentication. Please check your internet connection and try again."
          );
        }
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    }

    void bootstrap();

    const subscription =
      supabase?.auth.onAuthStateChange(
        (event, nextSession) => {
          if (!active) return;

          if (readDemoSession()) return;

          if (event === "PASSWORD_RECOVERY") {
            writeRecoveryState(true);
            setIsRecoverySession(true);
          }

          if (event === "SIGNED_OUT") {
            writeRecoveryState(false);
            setIsRecoverySession(false);
          }

          setRealSession(
            nextSession,
            event
          );
        }
      ).data.subscription;

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const api = useMemo<AuthApi>(
    () => ({
      user,

      session,

      isAuthenticated: Boolean(
        user &&
          (user.isDemo ||
            (session &&
              user.emailVerified))
      ),

      isReady,

      isDemoMode: Boolean(
        user?.isDemo
      ),

      isSupabaseConfigured,

      verificationEmail,

      connectionError,

      isRecoverySession,

      // ==================================================
      // SIGN UP
      // ==================================================

      signUp: async (
        rawEmail,
        password,
        rawName
      ) => {
        const email =
          rawEmail.trim().toLowerCase();

        const name =
          rawName.trim();

        if (!supabase) {
          return {
            ok: false,
            status: "error",
            message:
              "Supabase authentication is not configured. Choose Demo Mode or add the public Supabase environment variables.",
          };
        }

        try {
          const {
            data,
            error,
          } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name,
              },

              emailRedirectTo:
                `${window.location.origin}/auth/callback`,
            },
          });

          if (error) {
            return {
              ok: false,
              status: "error",
              message:
                friendlyAuthError(
                  error.message,
                  "signup"
                ),
            };
          }

          if (
            data.user &&
            !isVerified(data.user)
          ) {
            setVerificationEmail(email);

            return {
              ok: true,
              status:
                "verification-required",
              email,
              message:
                "Account created. Please check your email to verify your account.",
            };
          }

          if (
            data.session?.user &&
            isVerified(data.session.user)
          ) {
            setRealSession(
              data.session,
              "SIGNED_IN"
            );

            return {
              ok: true,
              status: "authenticated",
              message:
                "Account created successfully.",
            };
          }

          return {
            ok: true,
            status:
              "verification-required",
            email,
            message:
              "Account created. Please check your email to verify your account.",
          };
        } catch {
          return {
            ok: false,
            status: "error",
            message:
              "Unable to connect. Please check your internet connection and try again.",
          };
        }
      },

      // ==================================================
      // SIGN IN
      // ==================================================

      signIn: async (
        rawEmail,
        password
      ) => {
        const email =
          rawEmail.trim().toLowerCase();

        if (!supabase) {
          return {
            ok: false,
            status: "error",
            message:
              "Supabase authentication is not configured. Choose Demo Mode or add the public Supabase environment variables.",
          };
        }

        try {
          const {
            data,
            error,
          } =
            await supabase.auth.signInWithPassword(
              {
                email,
                password,
              }
            );

          if (error) {
            const unverified =
              /email.*confirm|email not confirmed/i.test(
                error.message
              );

            if (unverified) {
              setVerificationEmail(
                email
              );
            }

            return {
              ok: false,
              status: unverified
                ? "verification-required"
                : "error",
              email: unverified
                ? email
                : undefined,
              message:
                friendlyAuthError(
                  error.message,
                  "signin"
                ),
            };
          }

          if (
            !data.session?.user ||
            !isVerified(
              data.session.user
            )
          ) {
            await supabase.auth.signOut({
              scope: "local",
            });

            setVerificationEmail(
              email
            );

            return {
              ok: false,
              status:
                "verification-required",
              email,
              message:
                "Please verify your email before accessing GreenVest.",
            };
          }

          setRealSession(
            data.session,
            "SIGNED_IN"
          );

          setConnectionError(null);

          return {
            ok: true,
            status: "authenticated",
            message:
              "Signed in successfully.",
          };
        } catch {
          return {
            ok: false,
            status: "error",
            message:
              "Unable to connect. Please check your internet connection and try again.",
          };
        }
      },

      // ==================================================
      // RESEND VERIFICATION
      // ==================================================

      resendVerification: async (
        rawEmail
      ) => {
        const email =
          rawEmail.trim().toLowerCase();

        if (!supabase) {
          return {
            ok: false,
            status: "error",
            message:
              "Supabase authentication is not configured. Demo Mode is still available if you choose it.",
          };
        }

        try {
          const { error } =
            await supabase.auth.resend({
              type: "signup",
              email,
              options: {
                emailRedirectTo:
                  `${window.location.origin}/auth/callback`,
              },
            });

          if (error) {
            return {
              ok: false,
              status: "error",
              message:
                friendlyAuthError(
                  error.message,
                  "resend"
                ),
            };
          }

          setVerificationEmail(
            email
          );

          return {
            ok: true,
            status: "sent",
            email,
            message:
              "Verification email sent. Check your inbox before signing in.",
          };
        } catch {
          return {
            ok: false,
            status: "error",
            message:
              "Unable to connect. Please check your internet connection and try again.",
          };
        }
      },

      // ==================================================
      // AUTH CALLBACK
      // ==================================================

      completeAuthCallback:
        async () => {
          if (!supabase) {
            return {
              ok: false,
              status: "error",
              message:
                "Supabase authentication is not configured. Add your project URL and publishable key, then try again.",
            };
          }

          try {
            const code =
              new URLSearchParams(
                window.location.search
              ).get("code");

            let {
              data: sessionData,
              error: sessionError,
            } =
              await supabase.auth.getSession();

            if (sessionError) {
              return {
                ok: false,
                status: "error",
                message:
                  "We could not verify this email link. Please request a new verification email and try again.",
              };
            }

            if (
              code &&
              !sessionData.session
            ) {
              const {
                error: exchangeError,
              } =
                await supabase.auth.exchangeCodeForSession(
                  code
                );

              if (exchangeError) {
                return {
                  ok: false,
                  status: "error",
                  message:
                    "We could not verify this email link. Please request a new verification email and try again.",
                };
              }

              const refreshed =
                await supabase.auth.getSession();

              sessionData =
                refreshed.data;

              sessionError =
                refreshed.error;
            }

            if (
              sessionError ||
              !sessionData.session?.user
            ) {
              return {
                ok: false,
                status: "error",
                message:
                  "This verification link is invalid or expired. Please request a new verification email.",
              };
            }

            const {
              data: userData,
              error: userError,
            } =
              await supabase.auth.getUser();

            if (
              userError ||
              !userData.user
            ) {
              return {
                ok: false,
                status: "error",
                message:
                  "We could not verify your account. Please try signing in again.",
              };
            }

            if (
              !isVerified(
                userData.user
              )
            ) {
              setVerificationEmail(
                userData.user.email ||
                  null
              );

              return {
                ok: false,
                status:
                  "verification-required",
                email:
                  userData.user.email ||
                  undefined,
                message:
                  "Your email is not verified yet. Please check your inbox or request another verification email.",
              };
            }

            setRealSession(
              {
                ...sessionData.session,
                user: userData.user,
              },
              "SIGNED_IN"
            );

            setConnectionError(null);

            return {
              ok: true,
              status: "authenticated",
              message:
                "Your email has been verified. Opening GreenVest.",
            };
          } catch {
            return {
              ok: false,
              status: "error",
              message:
                "Unable to verify your email. Please check your internet connection and try again.",
            };
          }
        },

      // ==================================================
      // PASSWORD RESET
      // ==================================================

      sendPasswordReset:
        async (rawEmail) => {
          const email =
            rawEmail.trim().toLowerCase();

          if (!supabase) {
            return {
              ok: false,
              status: "error",
              message:
                "Supabase authentication is not configured. Password reset is unavailable in Demo Mode.",
            };
          }

          try {
            const { error } =
              await supabase.auth.resetPasswordForEmail(
                email,
                {
                  redirectTo:
                    `${window.location.origin}/reset-password`,
                }
              );

            if (error) {
              return {
                ok: false,
                status: "error",
                message:
                  friendlyAuthError(
                    error.message,
                    "reset"
                  ),
              };
            }

            return {
              ok: true,
              status: "sent",
              email,
              message:
                "Password reset link sent. Check your email.",
            };
          } catch {
            return {
              ok: false,
              status: "error",
              message:
                "Unable to connect. Please check your internet connection and try again.",
            };
          }
        },

      // ==================================================
      // UPDATE PASSWORD
      // ==================================================

      updatePassword:
        async (password) => {
          if (
            !supabase ||
            !session ||
            !isRecoverySession
          ) {
            return {
              ok: false,
              status: "error",
              message:
                "This password reset link is invalid or expired. Request a new reset link and try again.",
            };
          }

          try {
            const { error } =
              await supabase.auth.updateUser(
                {
                  password,
                }
              );

            if (error) {
              return {
                ok: false,
                status: "error",
                message:
                  friendlyAuthError(
                    error.message,
                    "update"
                  ),
              };
            }

            writeRecoveryState(false);
            setIsRecoverySession(false);

            return {
              ok: true,
              status: "updated",
              message:
                "Password updated successfully.",
            };
          } catch {
            return {
              ok: false,
              status: "error",
              message:
                "Unable to connect. Please check your internet connection and try again.",
            };
          }
        },

      // ==================================================
      // DEMO MODE
      // ==================================================

      enterDemoMode: async () => {
        if (session && supabase) {
          try {
            await supabase.auth.signOut({
              scope: "local",
            });
          } catch {
            // Continue into explicit local demo mode.
          }
        }

        const demoUser: AppUser = {
          id: "demo-local",
          email: "demo@greenvest.local",
          name: "GreenVest Demo",
          isDemo: true,
          emailVerified: true,
        };

        writeDemoSession(
          demoUser
        );

        setVerificationEmail(null);
        setSession(null);
        setUser(demoUser);
      },

      // ==================================================
      // UPDATE PROFILE
      // ==================================================

      updateProfile: async (
        rawName
      ) => {
        const name =
          rawName.trim();

        // User must exist.
        if (!user) {
          console.error(
            "Cannot update profile: user is not authenticated."
          );

          return false;
        }

        // Do not allow an empty name.
        if (!name) {
          return false;
        }

        // Explicit Demo Mode can still update locally.
        if (user.isDemo) {
          const nextUser: AppUser = {
            ...user,
            name,
          };

          setUser(nextUser);

          return true;
        }

        // Real Supabase profile update.
        if (!supabase) {
          console.error(
            "Cannot update profile: Supabase is not configured."
          );

          return false;
        }

        try {
          const {
            error,
          } = await supabase
            .from("profiles")
            .update({
              full_name: name,
            })
            .eq(
              "user_id",
              user.id
            );

          if (error) {
            console.error(
              "Profile update error:",
              {
                message:
                  error.message,
                code:
                  error.code,
                details:
                  error.details,
                hint:
                  error.hint,
              }
            );

            return false;
          }

          // Update local state ONLY after Supabase succeeds.
          setUser({
            ...user,
            name,
          });

          return true;
        } catch (error) {
          console.error(
            "Profile update error:",
            error
          );

          return false;
        }
      },

      // ==================================================
      // SIGN OUT
      // ==================================================

      signOut: async () => {
        clearDemoSession();
        writeRecoveryState(false);

        setIsRecoverySession(false);
        setVerificationEmail(null);
        setUser(null);
        setSession(null);

        if (supabase) {
          try {
            await supabase.auth.signOut();
          } catch {
            // Local auth state is cleared even if remote sign-out fails.
          }
        }
      },
    }),

    [
      connectionError,
      isReady,
      isRecoverySession,
      session,
      user,
      verificationEmail,
    ]
  );

  return (
    <AuthContext.Provider value={api}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const auth =
    useContext(AuthContext);

  if (!auth) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return auth;
}