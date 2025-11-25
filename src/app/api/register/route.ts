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
        let error: String = 'An error occurred during registration';
        if (err.message === 'duplicate key value violates unique constraint "users_username_key"')
            error = 'This username is already taken. Please choose a different one.'
        return NextResponse.json({ error }, { status: 400 });
    }
}