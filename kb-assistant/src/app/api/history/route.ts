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
            .from("chat_history")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) throw error;

        return NextResponse.json({ history: data });
        } catch (err: any) {
            console.error("HISTORY ERROR:", err);
            return NextResponse.json({ error: err.message }, { status: 500 });
    }
}