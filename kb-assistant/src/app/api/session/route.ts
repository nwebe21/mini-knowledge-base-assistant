import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("chat_sessions")
            .select("*")
            .eq("user_id", userId)
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
        const {userId, sessionTitle } = await req.json();

        if (!userId && !sessionTitle)
            return NextResponse.json({ error: "session title & user ID required" }, { status: 400 });

        const { data: session } = await supabase
                .from("chat_sessions")
                .insert([{ user_id: userId, title: sessionTitle || "New Chat" }])
                .select()
                .single();

            return NextResponse.json({ sessionId: session.id });
    } catch (error: any) {
        console.error('SESSION ERROR: ', error);
        return NextResponse.json({ error: error.message }, {status: 500});
    }
}
