import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  UserCredential,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  auth,
  db,
  authProvider,
  workspaceProvider,
  setCachedWorkspaceToken,
  getCachedWorkspaceToken,
  handleFirestoreError,
  OperationType,
} from "../lib/firebase";
import { UserProfile, AppProfile } from "../types";

export const DESIGNATED_ADMIN_EMAIL = "tejaswinidande2913@gmail.com";

export function computeProfileRole(email?: string | null): AppProfile {
  if (!email) return "USER";
  return email.trim().toLowerCase() === DESIGNATED_ADMIN_EMAIL.toLowerCase() ? "ADMIN" : "USER";
}

// In-flight guard to prevent duplicate welcome email calls during concurrent auth events
const inFlightWelcomeEmails = new Set<string>();

async function triggerWelcomeEmailDispatch(uid: string, email: string, displayName: string) {
  if (inFlightWelcomeEmails.has(uid)) return;
  inFlightWelcomeEmails.add(uid);

  try {
    const userDocRef = doc(db, "users", uid);
    const currentSnap = await getDoc(userDocRef);
    if (currentSnap.exists() && currentSnap.data()?.welcomeEmailStatus === "sent") {
      inFlightWelcomeEmails.delete(uid);
      return;
    }

    const response = await fetch("/api/welcome-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        email,
        displayName,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (response.ok && result.success) {
      console.log(`[Previa Welcome Email] Dispatched welcome email to: ${email}`);
      await setDoc(
        userDocRef,
        {
          welcomeEmailStatus: "sent",
          welcomeEmailSentAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else {
      console.warn(`[Previa Welcome Email] Failed to send welcome email:`, result.error || "Gateway error");
      await setDoc(
        userDocRef,
        {
          welcomeEmailStatus: "failed",
          welcomeEmailError: result.error || "Gateway dispatch failed",
        },
        { merge: true }
      );
    }
  } catch (err: any) {
    console.warn(`[Previa Welcome Email] Failed to send welcome email:`, err?.message || err);
    try {
      const userDocRef = doc(db, "users", uid);
      await setDoc(
        userDocRef,
        {
          welcomeEmailStatus: "failed",
          welcomeEmailError: err?.message || "Network error",
        },
        { merge: true }
      );
    } catch {
      // Non-blocking
    }
  } finally {
    inFlightWelcomeEmails.delete(uid);
  }
}

// Unified helper to synchronize Previa Google user profile in Firestore
export async function syncFirebaseUserProfile(
  fbUser: FirebaseUser,
  overrides?: {
    displayName?: string;
    company?: string;
  }
): Promise<UserProfile> {
  const profileRole = computeProfileRole(fbUser.email);
  const userDocRef = doc(db, "users", fbUser.uid);
  const nowIso = new Date().toISOString();

  let existingData: any = null;
  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      existingData = docSnap.data();
    }
  } catch (err) {
    console.warn(`[Previa Auth] Could not read users/${fbUser.uid}:`, err);
  }

  const name =
    overrides?.displayName ||
    existingData?.displayName ||
    fbUser.displayName ||
    fbUser.email?.split("@")[0] ||
    "Authorized Operator";

  const company = overrides?.company !== undefined ? overrides.company : (existingData?.company || "");

  const avatarUrl =
    existingData?.photoURL ||
    fbUser.photoURL ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      name || fbUser.email || "User"
    )}&backgroundColor=0f172a&textColor=ffffff`;

  const userProfile: UserProfile = {
    id: fbUser.uid,
    name,
    email: fbUser.email || existingData?.email || "",
    avatarUrl,
    profileRole,
    role:
      profileRole === "ADMIN"
        ? "System Administrator & Knowledge Officer"
        : "Logistics & Procurement Manager",
    company,
    provider: "google",
    auth_provider: "google",
    provider_user_id: fbUser.uid,
    created_at: existingData?.createdAt || nowIso,
  };

  try {
    if (!existingData) {
      console.log(`[Previa Auth] Creating new profile document at: users/${fbUser.uid}`);
      await setDoc(userDocRef, {
        uid: fbUser.uid,
        displayName: userProfile.name,
        email: userProfile.email,
        photoURL: userProfile.avatarUrl,
        company: userProfile.company || "",
        provider: "google",
        auth_provider: "google",
        provider_user_id: fbUser.uid,
        createdAt: nowIso,
        lastLoginAt: nowIso,
        welcomeEmailStatus: "pending",
      });
      triggerWelcomeEmailDispatch(fbUser.uid, userProfile.email, userProfile.name);
    } else {
      await setDoc(
        userDocRef,
        {
          uid: fbUser.uid,
          displayName: userProfile.name,
          email: userProfile.email,
          photoURL: userProfile.avatarUrl,
          company: userProfile.company || "",
          provider: "google",
          auth_provider: "google",
          provider_user_id: fbUser.uid,
          lastLoginAt: nowIso,
        },
        { merge: true }
      );
    }
  } catch (err: any) {
    console.error(`[Previa Auth] Firestore write failed for users/${fbUser.uid}:`, err);
    handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`);
  }

  return userProfile;
}

// EXISTING Firebase Google Sign-In Popup — UNCHANGED behavior
export async function signInWithGooglePopup(): Promise<{
  profile: UserProfile;
  firebaseUser: FirebaseUser;
}> {
  try {
    const result: UserCredential = await signInWithPopup(auth, authProvider);
    const fbUser = result.user;
    const profile = await syncFirebaseUserProfile(fbUser);
    return { profile, firebaseUser: fbUser };
  } catch (error: any) {
    console.error("[Previa Auth] Firebase Google Sign-In failed:", error);
    throw error;
  }
}

// Sign out from Firebase
export async function signOutFirebase(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.error("[Previa Auth] Firebase sign out error:", err);
  }
  setCachedWorkspaceToken(null);
}

// Workspace User OAuth flow for Google Drive & Google Sheets
export async function requestWorkspaceAccess(): Promise<string | null> {
  try {
    const result = await signInWithPopup(auth, workspaceProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;
    if (token) {
      setCachedWorkspaceToken(token);
      return token;
    }
    return null;
  } catch (error: any) {
    console.error("[Previa Auth] Workspace OAuth consent error:", error);
    throw error;
  }
}

export { auth, onAuthStateChanged, getCachedWorkspaceToken };
export type { FirebaseUser };
