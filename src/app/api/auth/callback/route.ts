import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type SupabaseServerClient = Awaited<
    ReturnType<typeof createServerSupabaseClient>
>;



export async function POST(req: NextRequest) {
  try {
    const { event, session } = await req.json();

    if (!event) {
      return NextResponse.json({ error: "Missing event" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      if (!session) {
        return NextResponse.json(
          { error: "Session required for sign-in" },
          { status: 400 }
        );
      }
      await supabase.auth.setSession(session);
    } else if (event === "SIGNED_OUT") {
      await supabase.auth.signOut();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Auth callback error:", error);
    return NextResponse.json(
      { error: error.message ?? "Auth callback failed" },
      { status: 500 }
    );
  }
}

// get user details before the any request
export const getUserFromRequest = async (
    req: NextRequest,
    supabase: SupabaseServerClient) => {
        const authHeader = req.headers.get("Authorization") || "";
        const [scheme, tokenValue] = authHeader.split(" ");
        const token =
        scheme?.toLowerCase() === "bearer" && tokenValue ? tokenValue : undefined;

        const {
            data: { user },
            error,
        } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();

        if (error) {
            console.error("Supabase auth error:", error);
            return null;
        }

        return user;
    };

