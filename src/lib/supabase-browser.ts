"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let browserSupabaseClient: SupabaseClient | null = null;
let authListenerBound = false;

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
        try {
          await fetch("/api/auth/callback", {
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

