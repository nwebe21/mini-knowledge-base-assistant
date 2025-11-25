"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [usernameError, setUsernameError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);

    // Redirect logged-in users to chat to prevent back navigation
    useEffect(() => {
        const storedUsername = localStorage.getItem("username");
        if (storedUsername) {
            router.replace(`/chat?username=${encodeURIComponent(storedUsername)}`);
        }
    }, [router]);

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();

        setError("");
        setUsernameError(false);
        setPasswordError(false);

        if (!username.trim() || !password.trim()) {
            setError("Please enter both username and password.");
            setUsernameError(!username.trim());
            setPasswordError(!password.trim());
            return;
        }

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                setError(errorData?.error || `Registration failed with status ${res.status}`);
                return;
            }

            const data = await res.json();

            if (data.error) {
                setError(data.error);
                return;
            }

            // Save userId and username in localStorage
            localStorage.setItem("userId", data.user.id);
            localStorage.setItem("username", username);

            router.push(`/chat?username=${encodeURIComponent(username)}`);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </button>

                <h2 className="text-indigo-600 mb-6">Register</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-gray-700 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setError("");
                                setUsernameError(false);
                            }}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                usernameError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"
                            } text-black`}
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
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError("");
                                    setPasswordError(false);
                                }}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                                    passwordError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"
                                } text-black`}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
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
                        Register
                    </button>
                </form>
            </div>
        </div>
    );
}

export default RegisterPage;