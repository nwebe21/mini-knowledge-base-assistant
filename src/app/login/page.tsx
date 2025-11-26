"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Eye, EyeOff } from 'lucide-react';
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { usernameToEmail } from "@/lib/auth-utils";

export default function LoginPage() {
    const router = useRouter();
    const supabase = getSupabaseBrowserClient();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                router.replace("/chat");
            }
        };
        checkSession();
    }, [router, supabase]);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        if (!username.trim() || !password.trim()) {
            setError("Please enter both username and password.");
            setIsSubmitting(false);
            return;
        }

        try {
            const derivedEmail = usernameToEmail(username);
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: derivedEmail,
                password: password.trim(),
            });

            if (authError || !data.user) {
                setError(authError?.message || "Login failed.");
                setIsSubmitting(false);
                return;
            }

            router.push("/chat");
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 to-purple-600 overflow-x-hidden overflow-y-auto">
            {/* Back Button */}
            <div className="w-full p-8">
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition w-max"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>
            </div>

            {/* Form Container */}
            <div className="flex-1 flex justify-center items-center px-4 min-w-0">
                <div className="bg-white rounded-2xl p-6 sm:p-10 w-full max-w-md shadow-2xl overflow-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
                        <p className="text-gray-500">Sign in to continue your journey</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-gray-700 mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full border-2 border-gray-200 px-4 py-2 rounded-lg focus:border-indigo-500 text-black"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Password</label>
                            <div className="relative flex items-center">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:-translate-y-1 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Signing In..." : "Sign In"}
                        </button>
                    </form>

                    <p className="text-center text-gray-500 text-sm mt-6">
                        Don’t have an account?{' '}
                        <span
                            className="text-indigo-600 font-semibold cursor-pointer hover:underline"
                            onClick={() => router.push("/register")}
                        >
                            Sign up
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}