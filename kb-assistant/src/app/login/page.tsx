"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    try {
        const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (data.error) {
        setError(data.error);
        return;
        }

        // Save userId in localStorage
        localStorage.setItem("userId", data.user.id);

        router.push("/chat");
    } catch (err: any) {
        setError(err.message);
    }
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-6">
            <form
            onSubmit={handleLogin}
            className="w-full max-w-sm p-6 bg-white shadow rounded"
            >
            <h1 className="text-2xl font-bold mb-4">Login</h1>

            {error && <p className="text-red-600 mb-2">{error}</p>}

            <input
                className="w-full p-2 border rounded mb-3"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />

            <input
                className="w-full p-2 border rounded mb-3"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />

            <button
                type="submit"
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
                Login
            </button>
            </form>
        </div>
    );
}