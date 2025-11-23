import { NextRequest, NextResponse } from "next/server";
import { getLastChats } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
    const rows = await getLastChats(50);
    return NextResponse.json({ rows });
    } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}