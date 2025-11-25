"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from 'lucide-react';

interface RegisterPageProps {
    onRegister: (username: string) => void;
    onBack: () => void;
}

export function RegisterPage({ onRegister, onBack }: RegisterPageProps) {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    try {
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (data.error) {
            setError(data.error);
            return;
        }

        // Save userId into localStorage
        localStorage.setItem("userId", data.user.id);
        onRegister(username);
        } catch (err: any) {
        setError(err.message);
        }
    }

    return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
        </button>

        <h2 className="text-indigo-600 mb-6">Register</h2>

        <form onSubmit={handleRegister} className="space-y-4">
            <div>
            <label htmlFor="username" className="block text-gray-700 mb-2">
                Username
            </label>
            <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                required
            />
            </div>

            <div>
            <label htmlFor="password" className="block text-gray-700 mb-2">
                Password
            </label>
            <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                required
            />
            </div>

            <button
            type="submit"
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
            Register
            </button>
        </form>
        </div>
    </div>
    );
}