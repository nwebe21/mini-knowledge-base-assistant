"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
    onLogin: (username: string) => void;
    onBack: () => void;
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

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
            onLogin(username);
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

            <h2 className="text-indigo-600 mb-6">Login</h2>

            <form onSubmit={handleLogin} className="space-y-4">
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
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black pr-10"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800 focus:outline-none"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
                </div>

                <button
                type="submit"
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                Login
                </button>
            </form>
            </div>
        </div>
    );
}