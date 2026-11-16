import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { UserProfile, AppProfile } from "../types";
import {
  authService,
  getFriendlyAuthErrorMessage,
} from "../auth/authService";
import {
  auth,
  onAuthStateChanged,
  FirebaseUser,
  syncFirebaseUserProfile,
  getCachedWorkspaceToken,
  computeProfileRole as computeFirebaseRole,
} from "../auth/firebaseAuth";
import {
  getSupabaseSession,
  onSupabaseAuthStateChange,
  syncSupabaseUserProfile,
  isSupabaseConfigured,
  computeProfileRole as computeSupabaseRole,
} from "../auth/supabaseAuth";
import { validateFirestoreConnection } from "../lib/firebase";

export { getFriendlyAuthErrorMessage };
export const DESIGNATED_ADMIN_EMAIL = "tejaswinidande2913@gmail.com";

export function computeProfileRole(email?: string | null): AppProfile {
  if (!email) return "USER";
  return email.trim().toLowerCase() === DESIGNATED_ADMIN_EMAIL.toLowerCase() ? "ADMIN" : "USER";
}

export type AuthMode = "signin" | "signup" | "forgot_password";
export type AuthModalMode = "login" | "signup" | "forgot_password";

export interface RegisterResult {
  profile?: UserProfile;
  requiresEmailVerification: boolean;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  authModalOpen: boolean;
  isAuthModalOpen: boolean;
  authMode: AuthMode;
  authModalMode: AuthModalMode;
  profileRole: AppProfile;
  isAdmin: boolean;
  openAuthModal: (target?: string, mode?: AuthMode | AuthModalMode) => void;
  closeAuthModal: () => void;
  setAuthModalOpen: (open: boolean) => void;
  setAuthMode: (mode: AuthMode) => void;
  setAuthModalMode: (mode: AuthModalMode) => void;
  loginWithGooglePopup: () => Promise<UserProfile | null>;
  loginWithGoogle: () => Promise<UserProfile | null>;
  registerWithEmailPassword: (params: {
    fullName: string;
    email: string;
    password: string;
    company?: string;
  }) => Promise<RegisterResult>;
  loginWithEmailPassword: (email: string, password: string) => Promise<UserProfile>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  redirectTarget: string | null;
  hasWorkspacePermission: boolean;
  requestWorkspaceAccess: () => Promise<string | null>;
  getWorkspaceToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Independent Modal State:
  // authModalOpen controls ONLY whether the modal is visible.
  // authMode controls ONLY which authentication tab/content is displayed.
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");

  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  const [hasWorkspacePermission, setHasWorkspacePermission] = useState(false);

  // Active provider tracker to avoid cross-over state stomping
  const activeAuthProviderRef = useRef<"firebase" | "supabase" | null>(null);

  useEffect(() => {
    validateFirestoreConnection().catch(console.error);

    let isSubscribed = true;
    let initialFirebaseDone = false;
    let initialSupabaseDone = false;

    const checkInitialLoadingFinished = () => {
      if (initialFirebaseDone && initialSupabaseDone) {
        if (isSubscribed) {
          setIsLoadingAuth(false);
        }
      }
    };

    // 1. Listen for Supabase Authentication State (Email/Password)
    if (isSupabaseConfigured()) {
      getSupabaseSession()
        .then(async (session) => {
          if (!isSubscribed) return;
          if (session?.user && activeAuthProviderRef.current !== "firebase") {
            try {
              const profile = await syncSupabaseUserProfile(session.user);
              if (isSubscribed) {
                setCurrentUser(profile);
                activeAuthProviderRef.current = "supabase";
              }
            } catch (err) {
              console.warn("[Previa Auth] Supabase initial profile sync note:", err);
            }
          }
        })
        .finally(() => {
          initialSupabaseDone = true;
          checkInitialLoadingFinished();
        });

      const { data: sbAuthListener } = onSupabaseAuthStateChange(async (event, session) => {
        if (!isSubscribed) return;
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          if (session?.user && activeAuthProviderRef.current !== "firebase") {
            try {
              const profile = await syncSupabaseUserProfile(session.user);
              if (isSubscribed) {
                setCurrentUser(profile);
                activeAuthProviderRef.current = "supabase";
              }
            } catch (err) {
              console.warn("[Previa Auth] Supabase auth state change profile sync note:", err);
            }
          }
        } else if (event === "SIGNED_OUT") {
          if (activeAuthProviderRef.current === "supabase") {
            setCurrentUser(null);
            activeAuthProviderRef.current = null;
          }
        }
      });

      // Cleanup Supabase subscription
      var cleanupSupabase = () => {
        sbAuthListener?.subscription?.unsubscribe();
      };
    } else {
      initialSupabaseDone = true;
    }

    // 2. Listen for Firebase Authentication State (Google Sign-In)
    const unsubscribeFirebase = onAuthStateChanged(auth, async (fbUser) => {
      if (!isSubscribed) return;
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          activeAuthProviderRef.current = "firebase";
          const profile = await syncFirebaseUserProfile(fbUser);
          if (isSubscribed) {
            setCurrentUser(profile);
          }
        } catch (err) {
          console.warn("[Previa Auth] Firebase auth sync note:", err);
        }
      } else {
        if (activeAuthProviderRef.current === "firebase") {
          setCurrentUser(null);
          activeAuthProviderRef.current = null;
        }
      }

      initialFirebaseDone = true;
      checkInitialLoadingFinished();
    });

    return () => {
      isSubscribed = false;
      unsubscribeFirebase();
      if (cleanupSupabase) cleanupSupabase();
    };
  }, []);

  // Modal controls
  const openAuthModal = useCallback((target = "intelligence", mode: AuthMode | AuthModalMode = "signin") => {
    setRedirectTarget(target);
    const normalizedMode = mode === "login" ? "signin" : (mode as AuthMode);
    setAuthMode(normalizedMode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const setAuthModalMode = useCallback((mode: AuthModalMode) => {
    const normalizedMode = mode === "login" ? "signin" : (mode as AuthMode);
    setAuthMode(normalizedMode);
  }, []);

  // Google Sign-In — Continues using EXISTING Firebase Authentication
  const loginWithGooglePopup = async (): Promise<UserProfile | null> => {
    try {
      const { profile, firebaseUser: fbUser } = await authService.signInWithGoogle();
      activeAuthProviderRef.current = "firebase";
      setCurrentUser(profile);
      setFirebaseUser(fbUser);
      setAuthModalOpen(false);
      return profile;
    } catch (error: any) {
      console.error("[Previa Auth] Google Sign-In error:", error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    return loginWithGooglePopup();
  };

  // Email/Password Registration — Handled exclusively by Supabase Auth
  const registerWithEmailPassword = async (params: {
    fullName: string;
    email: string;
    password: string;
    company?: string;
  }): Promise<RegisterResult> => {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.fullName.trim();
    const cleanCompany = params.company?.trim() || "";

    if (!cleanName) {
      throw new Error("Full name is required.");
    }
    if (!cleanEmail) {
      throw new Error("Email address is required.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      const error: any = new Error("Please enter a valid email address.");
      error.code = "auth/invalid-email";
      throw error;
    }
    if (!params.password) {
      throw new Error("Password is required.");
    }
    if (params.password.length < 8) {
      const error: any = new Error(
        "Password must be at least 8 characters and meet the required password rules."
      );
      error.code = "auth/weak-password";
      throw error;
    }

    const result = await authService.signUpWithEmail({
      fullName: cleanName,
      email: cleanEmail,
      password: params.password,
      company: cleanCompany,
    });

    if (result.session && result.profile) {
      activeAuthProviderRef.current = "supabase";
      setCurrentUser(result.profile);
      setFirebaseUser(null);
      setAuthModalOpen(false);
    }

    return {
      profile: result.profile,
      requiresEmailVerification: result.requiresEmailVerification,
    };
  };

  // Email/Password Login — Handled exclusively by Supabase Auth
  const loginWithEmailPassword = async (
    email: string,
    password: string
  ): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error("Email address is required.");
    }
    if (!password) {
      throw new Error("Password is required.");
    }

    const { profile } = await authService.signInWithEmail(cleanEmail, password);
    activeAuthProviderRef.current = "supabase";
    setCurrentUser(profile);
    setFirebaseUser(null);
    setAuthModalOpen(false);
    return profile;
  };

  // Password Recovery — Handled exclusively by Supabase Auth
  const sendPasswordReset = async (email: string): Promise<void> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error("Email address is required.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      const error: any = new Error("Please enter a valid email address.");
      error.code = "auth/invalid-email";
      throw error;
    }

    await authService.resetPassword(cleanEmail);
  };

  // Dedicated Workspace Access Request
  const requestWorkspaceAccess = async (): Promise<string | null> => {
    const token = await authService.requestWorkspaceAccess();
    if (token) {
      setHasWorkspacePermission(true);
    }
    return token;
  };

  const getWorkspaceToken = () => {
    return getCachedWorkspaceToken();
  };

  // Sign out — Clears sessions from both providers
  const logout = async () => {
    await authService.signOut();
    activeAuthProviderRef.current = null;
    setHasWorkspacePermission(false);
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  const effectiveProfileRole: AppProfile =
    currentUser?.profileRole ||
    computeProfileRole(firebaseUser?.email || currentUser?.email);

  const isAdmin = effectiveProfileRole === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isAuthenticated: !!currentUser,
        isLoadingAuth,
        authModalOpen,
        isAuthModalOpen: authModalOpen,
        authMode,
        authModalMode: authMode === "signin" ? "login" : authMode,
        profileRole: effectiveProfileRole,
        isAdmin,
        openAuthModal,
        closeAuthModal,
        setAuthModalOpen,
        setAuthMode,
        setAuthModalMode,
        loginWithGooglePopup,
        loginWithGoogle,
        registerWithEmailPassword,
        loginWithEmailPassword,
        sendPasswordReset,
        logout,
        redirectTarget,
        hasWorkspacePermission,
        requestWorkspaceAccess,
        getWorkspaceToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
