import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "../auth/callback/route";


export async function GET(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const user = await getUserFromRequest(req, supabase);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("chat_sessions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) throw error;

        return NextResponse.json({ sessions: data });
    } catch (err: any) {
        console.error("SESSION ERROR:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const user = await getUserFromRequest(req, supabase);

        if (!user)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { sessionTitle } = await req.json();

        if (!sessionTitle) {
            return NextResponse.json(
            { error: "Session title is required" },
            { status: 400 }
            );
        }

        const { data: session, error } = await supabase
            .from("chat_sessions")
            .insert([{ user_id: user.id, title: sessionTitle || "New Chat" }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ sessionId: session.id });
    } catch (err: any) {
        console.error("SESSION ERROR:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const user = await getUserFromRequest(req, supabase);

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { sessionId } = await req.json();

        if (!sessionId) {
            return NextResponse.json(
            { error: "sessionId is required" },
            { status: 400 }
            );
        }

        const { error } = await supabase
            .from("chat_sessions")
            .delete()
            .eq("id", sessionId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("DELETE SESSION ERROR:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}