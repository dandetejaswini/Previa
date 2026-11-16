import {
  signInWithGooglePopup as fbSignInWithGoogle,
  signOutFirebase,
  requestWorkspaceAccess as fbRequestWorkspaceAccess,
  FirebaseUser,
} from "./firebaseAuth";
import {
  signUpWithEmail as sbSignUpWithEmail,
  signInWithEmail as sbSignInWithEmail,
  resetPasswordForEmail as sbResetPassword,
  signOutSupabase,
  isSupabaseConfigured,
  SignUpResult,
} from "./supabaseAuth";
import { UserProfile } from "../types";

export function getFriendlyAuthErrorMessage(
  err: any,
  context: "login" | "signup" | "reset" | "google" = "login"
): string {
  if (!err) return "";
  const code = (typeof err === "string" ? err : err?.code || "").toLowerCase();
  const rawMsg = (err?.message || "").toLowerCase();

  // Supabase unconfigured
  if (
    rawMsg.includes("vite_supabase_url") ||
    rawMsg.includes("supabase authentication is not configured")
  ) {
    return "Supabase Authentication is not configured yet. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment variables.";
  }

  // Already registered email
  if (
    code.includes("email-already-in-use") ||
    code.includes("user_already_exists") ||
    rawMsg.includes("user already registered") ||
    rawMsg.includes("already registered") ||
    rawMsg.includes("email already in use")
  ) {
    return "This email is already registered. Please sign in.";
  }

  // Invalid email format
  if (code.includes("invalid-email") || rawMsg.includes("invalid email")) {
    return "Please enter a valid email address.";
  }

  // Weak password
  if (
    code.includes("weak-password") ||
    rawMsg.includes("password should be at least") ||
    rawMsg.includes("weak password") ||
    rawMsg.includes("password is too short")
  ) {
    return "Password must be at least 8 characters and meet the required password rules.";
  }

  // Invalid login credentials / user not found / wrong password
  if (
    code.includes("invalid-credential") ||
    code.includes("user-not-found") ||
    code.includes("wrong-password") ||
    rawMsg.includes("invalid login credentials") ||
    rawMsg.includes("invalid credentials") ||
    rawMsg.includes("user not found")
  ) {
    return "Email or password is incorrect.";
  }

  // Email not confirmed
  if (
    rawMsg.includes("email not confirmed") ||
    rawMsg.includes("not verified") ||
    code.includes("email_not_confirmed")
  ) {
    return "Please verify your email before signing in.";
  }

  // Rate limiting / too many requests
  if (
    code.includes("too-many-requests") ||
    rawMsg.includes("rate limit") ||
    rawMsg.includes("too many requests") ||
    rawMsg.includes("over_email_send_rate_limit")
  ) {
    return "Too many attempts. Please try again later.";
  }

  // Disabled user
  if (code.includes("user-disabled") || rawMsg.includes("user disabled")) {
    return "This account has been disabled. Please contact system support.";
  }

  // Google Popup errors
  if (code.includes("popup-closed-by-user") || code.includes("cancelled-popup-request")) {
    return "Sign-in popup was closed before completion. Please try again.";
  }
  if (code.includes("popup-blocked")) {
    return "Popup was blocked by your browser. Please allow popups for this site.";
  }

  // Network connection failures
  if (
    code.includes("network-request-failed") ||
    rawMsg.includes("failed to fetch") ||
    rawMsg.includes("network error")
  ) {
    return "Unable to connect right now. Please check your internet connection and try again.";
  }

  // Generic friendly fallbacks
  if (context === "signup") {
    return "Unable to create your account right now. Please try again.";
  }
  if (context === "reset") {
    return "If an account exists for this email, we'll send instructions to reset your password.";
  }
  if (context === "google") {
    return "Unable to complete Google sign-in. Please try again.";
  }

  return "Email or password is incorrect.";
}

export const authService = {
  // Google Sign-In via Firebase
  signInWithGoogle: async (): Promise<{ profile: UserProfile; firebaseUser: FirebaseUser }> => {
    return fbSignInWithGoogle();
  },

  // Email/Password Sign-In via Supabase
  signInWithEmail: async (
    email: string,
    password: string
  ): Promise<{ profile: UserProfile }> => {
    const { profile } = await sbSignInWithEmail(email, password);
    return { profile };
  },

  // Email/Password Registration via Supabase
  signUpWithEmail: async (params: {
    fullName: string;
    email: string;
    password: string;
    company?: string;
  }): Promise<SignUpResult> => {
    return sbSignUpWithEmail(params);
  },

  // Password Recovery via Supabase
  resetPassword: async (email: string): Promise<void> => {
    return sbResetPassword(email);
  },

  // Sign out from both providers
  signOut: async (): Promise<void> => {
    await Promise.allSettled([signOutFirebase(), signOutSupabase()]);
  },

  // Workspace OAuth Access
  requestWorkspaceAccess: async (): Promise<string | null> => {
    return fbRequestWorkspaceAccess();
  },

  isSupabaseConfigured,
};
