import { createClient, SupabaseClient, User as SupabaseUser, Session } from "@supabase/supabase-js";
import { UserProfile, AppProfile } from "../types";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Extract public Supabase environment variables safely for the browser client
const supabaseUrl: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" && process.env?.VITE_SUPABASE_URL) ||
  "";

// Use the Supabase publishable key for browser authentication
const supabasePublishableKey: string =
  (typeof import.meta !== "undefined" &&
    (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY)) ||
  (typeof process !== "undefined" &&
    (process.env?.VITE_SUPABASE_PUBLISHABLE_KEY || process.env?.VITE_SUPABASE_ANON_KEY)) ||
  "";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabasePublishableKey &&
    supabaseUrl.startsWith("http") &&
    !supabaseUrl.includes("placeholder")
  );
}

// Browser Supabase client instance using @supabase/supabase-js and publishable key
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? supabaseUrl : "https://placeholder-previa.supabase.co",
  isSupabaseConfigured() ? supabasePublishableKey : "placeholder-publishable-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const DESIGNATED_ADMIN_EMAIL = "tejaswinidande2913@gmail.com";

export function computeProfileRole(email?: string | null): AppProfile {
  if (!email) return "USER";
  return email.trim().toLowerCase() === DESIGNATED_ADMIN_EMAIL.toLowerCase() ? "ADMIN" : "USER";
}

// Ensure the profile table record exists in Supabase and also synchronize with Previa Firestore
export async function syncSupabaseUserProfile(
  user: SupabaseUser,
  overrides?: {
    name?: string;
    company?: string;
  }
): Promise<UserProfile> {
  const profileRole = computeProfileRole(user.email);
  const nowIso = new Date().toISOString();

  const name =
    overrides?.name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Authorized Operator";

  const company =
    overrides?.company !== undefined
      ? overrides.company
      : user.user_metadata?.company || "";

  const roleTitle =
    profileRole === "ADMIN"
      ? "System Administrator & Knowledge Officer"
      : "Logistics & Procurement Manager";

  const avatarUrl =
    user.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      name || user.email || "User"
    )}&backgroundColor=0f172a&textColor=ffffff`;

  const profile: UserProfile = {
    id: user.id,
    name,
    email: user.email || "",
    avatarUrl,
    profileRole,
    role: roleTitle,
    company,
    provider: "password",
    auth_provider: "email",
    provider_user_id: user.id,
    created_at: user.created_at || nowIso,
  };

  // 1. Supabase Profiles Table record (id, name, email, company, auth_provider, provider_user_id, role, created_at)
  if (isSupabaseConfigured()) {
    try {
      const { error: upsertErr } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          name: profile.name,
          email: profile.email,
          company: profile.company || "",
          auth_provider: "email",
          provider_user_id: user.id,
          role: profile.role,
          created_at: profile.created_at,
        },
        { onConflict: "id" }
      );
      if (upsertErr) {
        console.warn("[Previa Supabase] Supabase profiles upsert note:", upsertErr.message);
      }
    } catch (dbErr) {
      console.warn("[Previa Supabase] Could not write to Supabase profiles table:", dbErr);
    }
  }

  // 2. Synchronize to Firestore users collection so existing Previa platform services work seamlessly
  try {
    const userDocRef = doc(db, "users", user.id);
    const existingSnap = await getDoc(userDocRef);
    if (!existingSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.id,
        displayName: profile.name,
        email: profile.email,
        photoURL: profile.avatarUrl,
        company: profile.company || "",
        provider: "password",
        auth_provider: "email",
        provider_user_id: user.id,
        createdAt: nowIso,
        lastLoginAt: nowIso,
        welcomeEmailStatus: "pending",
      });
      // Fire-and-forget welcome email dispatch
      fetch("/api/welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.id,
          email: profile.email,
          displayName: profile.name,
        }),
      }).catch(() => {});
    } else {
      await setDoc(
        userDocRef,
        {
          uid: user.id,
          displayName: profile.name,
          email: profile.email,
          photoURL: profile.avatarUrl,
          company: profile.company || "",
          provider: "password",
          auth_provider: "email",
          provider_user_id: user.id,
          lastLoginAt: nowIso,
        },
        { merge: true }
      );
    }
  } catch (fsErr) {
    console.warn("[Previa Auth] Optional Firestore mirror note for Supabase user:", fsErr);
  }

  return profile;
}

export interface SignUpResult {
  user: SupabaseUser | null;
  session: Session | null;
  requiresEmailVerification: boolean;
  profile?: UserProfile;
}

// 1. Supabase Email + Password Sign Up
export async function signUpWithEmail(params: {
  fullName: string;
  email: string;
  password: string;
  company?: string;
}): Promise<SignUpResult> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase Authentication is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set."
    );
  }

  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.fullName.trim();
  const cleanCompany = params.company?.trim() || "";

  // Call official Supabase Auth sign up API
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: params.password,
    options: {
      data: {
        full_name: cleanName,
        company: cleanCompany,
      },
    },
  });

  if (error) {
    console.error("[Previa Supabase] signUp failed:", error.message);
    throw error;
  }

  const user = data.user;
  const session = data.session;

  // Supabase returns an empty identities array if user already registered (when email confirmation is enabled)
  if (user && user.identities && user.identities.length === 0) {
    const duplicateError: any = new Error("This email is already registered. Please sign in.");
    duplicateError.code = "user_already_exists";
    throw duplicateError;
  }

  // If email verification is enabled on Supabase project, session will be null
  const requiresEmailVerification = !session;

  let profile: UserProfile | undefined = undefined;
  if (user) {
    profile = await syncSupabaseUserProfile(user, {
      name: cleanName,
      company: cleanCompany,
    });
  }

  return {
    user,
    session,
    requiresEmailVerification,
    profile,
  };
}

// 2. Supabase Email + Password Sign In
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: SupabaseUser; session: Session; profile: UserProfile }> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase Authentication is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set."
    );
  }

  const cleanEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    console.error("[Previa Supabase] signInWithPassword failed:", error.message);
    throw error;
  }

  if (!data.user || !data.session) {
    throw new Error("Unable to establish an authenticated session. Please try again.");
  }

  const profile = await syncSupabaseUserProfile(data.user);

  return {
    user: data.user,
    session: data.session,
    profile,
  };
}

// 3. Supabase Password Recovery
export async function resetPasswordForEmail(email: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase Authentication is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set."
    );
  }

  const cleanEmail = email.trim().toLowerCase();
  const redirectOrigin = typeof window !== "undefined" ? window.location.origin : "";

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: redirectOrigin ? `${redirectOrigin}/#login` : undefined,
  });

  if (error) {
    console.error("[Previa Supabase] resetPasswordForEmail failed:", error.message);
    throw error;
  }
}

// 4. Supabase Sign Out
export async function signOutSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("[Previa Supabase] signOut notice:", err);
  }
}

// 5. Get current active Supabase session
export async function getSupabaseSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

// 6. Listen to Supabase auth state changes
export function onSupabaseAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  if (!isSupabaseConfigured()) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
