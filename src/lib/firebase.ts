import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Explicitly target existing provisioned Firestore database ID in project directed-stack-8pthm
export const FIRESTORE_DATABASE_ID = "ai-studio-previa-d109a825-f4ba-4a79-9979-eed58116cb4b";
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);

// Google Auth Provider for App User Sign-In (Basic Profile + Email)
export const authProvider = new GoogleAuthProvider();
authProvider.setCustomParameters({
  prompt: "select_account",
});

// Google Auth Provider specifically for User-Owned Workspace Data Import (Drive + Sheets)
// Uses minimum required scopes for user-authorized sheet reading and selected-file workflow
export const workspaceProvider = new GoogleAuthProvider();
workspaceProvider.addScope("https://www.googleapis.com/auth/drive.file");
workspaceProvider.addScope("https://www.googleapis.com/auth/spreadsheets.readonly");
workspaceProvider.setCustomParameters({
  prompt: "consent",
});

// In-memory cache for user's Workspace Access Token (NEVER in localStorage)
let cachedWorkspaceToken: string | null = null;

export const setCachedWorkspaceToken = (token: string | null) => {
  cachedWorkspaceToken = token;
};

export const getCachedWorkspaceToken = () => {
  return cachedWorkspaceToken;
};

// Validate connection to Firestore as mandated by Firebase skill
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error: any) {
    // If permission-denied or client offline, connection reached server or handled
    if (error?.message?.includes("the client is offline")) {
      console.warn("Firestore client is running in offline cache mode.");
      return false;
    }
    return true;
  }
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  databaseId: string;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    databaseId: FIRESTORE_DATABASE_ID,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  return errInfo;
}
