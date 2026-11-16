/**
 * Previa Multi-User Authenticated API Client
 * 
 * Attaches verified authenticated user context (Firebase UID and token) to every backend request
 * to enforce server-side data isolation.
 */

import { auth } from "./firebase";
import { UserProfile } from "../types";

export function getAuthHeaders(currentUser?: UserProfile | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const uid = currentUser?.id || auth.currentUser?.uid;
  if (uid) {
    headers["x-previa-user-id"] = uid;
  }

  const email = currentUser?.email || auth.currentUser?.email;
  if (email) {
    headers["x-previa-user-email"] = email;
  }

  return headers;
}

export async function authFetch(
  url: string,
  options: RequestInit = {},
  currentUser?: UserProfile | null
): Promise<Response> {
  const baseHeaders = getAuthHeaders(currentUser);

  // If Firebase user is available, try getting an ID token if not already attached
  if (auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      if (idToken) {
        baseHeaders["Authorization"] = `Bearer ${idToken}`;
      }
    } catch (_) {
      // Non-blocking fallback to x-previa-user-id
    }
  }

  const mergedHeaders = {
    ...baseHeaders,
    ...(options.headers as Record<string, string> || {}),
  };

  return fetch(url, {
    ...options,
    headers: mergedHeaders,
  });
}
