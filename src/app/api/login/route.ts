import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/users";

export async function POST(req: NextRequest) {
    const { username, password } = await req.json();
    if (!username || !password)
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    try {
        const user = await loginUser(username, password);
        return NextResponse.json({ user });
    } catch (err: any) {
        let error = 'Sorry, something went wrong when processing your request.';
        if (err.message === 'Invalid credentials')
            error = "Invalid login credentials. Please try again.";
        return NextResponse.json({ error }, { status: 401 });
    }
}