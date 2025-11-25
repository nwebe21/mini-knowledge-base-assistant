import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/users";

export async function POST(req: NextRequest) {
    const { username, password } = await req.json();
    if (!username || !password)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    try {
    const user = await registerUser(username, password);
    return NextResponse.json({ user });
    } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
    }
}