"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from 'lucide-react';
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { usernameToEmail } from "@/lib/auth-utils";


function RegisterPage() {
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-4 w-full overflow-x-hidden overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Create Account</h2>
                <p className="text-gray-500 mb-6 text-center">Start your travel adventure today</p>

                { error && (<div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>) }

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="flex flex-col">
                        <label className="text-gray-700 font-medium mb-1">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-gray-700 font-medium mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-gray-700 font-medium mb-1">Password</label>
                        <div className="relative flex items-center w-full">
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
                        className="w-full bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <p className="text-center text-gray-500 mt-4 text-sm">
                    Already have an account?{" "}
                    <span
                        onClick={() => router.push("/login")}
                        className="text-indigo-600 font-medium cursor-pointer hover:underline"
                    >
                        Sign in
                    </span>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;