"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let browserSupabaseClient: SupabaseClient | null = null;
let authListenerBound = false;

const AUTH_CALLBACK_PATH = "/api/auth/callback";

export const getSupabaseBrowserClient = () => {
  if (!browserSupabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
      );
    }

    browserSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    if (!authListenerBound) {
      browserSupabaseClient.auth.onAuthStateChange(async (event, session) => {
        const callbackUrl = getAuthCallbackUrl();
        if (!callbackUrl) {
          console.warn(
            "Unable to determine URL for auth callback. Set NEXT_PUBLIC_APP_URL (or configure `window.location.origin`)."
          );
          return;
        }
        try {
          await fetch(callbackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event, session }),
          });
        } catch (error) {
          console.error("Failed syncing auth state to server:", error);
        }
      });
      authListenerBound = true;
    }
  }

  return browserSupabaseClient;
};

function getAuthCallbackUrl() {
  if (typeof window !== "undefined" && window.location.origin) {
    return new URL(AUTH_CALLBACK_PATH, window.location.origin).toString();
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : undefined);

  return baseUrl ? new URL(AUTH_CALLBACK_PATH, baseUrl).toString() : undefined;
}
