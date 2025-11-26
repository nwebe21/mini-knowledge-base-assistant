"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { usernameToEmail } from "@/lib/auth-utils";


export default function RegisterPage() {
    const router = useRouter();
    const supabase = getSupabaseBrowserClient();
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect if user is already logged in
    useEffect(() => {
    const checkSession = async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
        router.replace("/chat");
        }
    };

    checkSession();
    }, [router, supabase]);

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!fullName.trim() || !username.trim() || !password.trim()) {
            setError("Please fill in all fields.");
            return;
        }

        try {
            setIsSubmitting(true);
            const derivedEmail = usernameToEmail(username);
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: derivedEmail,
                password: password.trim(),
                options: {
                    data: {
                        full_name: fullName.trim(),
                        username: username.trim(),
                    },
                },
            });

            if (signUpError || !data.user) {
                setError(signUpError?.message || "Registration failed.");
                setIsSubmitting(false);
                return;
            }

            if (data.session) {
                router.push("/chat");
            } else {
                setError("Please confirm the email we generated for you to finish signing up.");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
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
                        <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
                        <p className="text-gray-500">Sign up and let AI guide your adventure</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div>
                            <label className="block text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full border-2 border-gray-200 px-4 py-2 rounded-lg focus:border-indigo-500 text-gray-700"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full border-2 border-gray-200 px-4 py-2 rounded-lg focus:border-indigo-500 text-gray-700"
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
                                    className="w-full border border-gray-300 rounded px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
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
                            {isSubmitting ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    <p className="text-center text-gray-500 text-sm mt-6">
                        Already have an account?{" "}
                        <span
                            className="text-indigo-600 font-semibold cursor-pointer hover:underline"
                            onClick={() => router.push("/login")}
                        >
                            Sign in
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
