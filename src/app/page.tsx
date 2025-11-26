"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function Page() {
    const router = useRouter();
    const supabase = getSupabaseBrowserClient();

    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                router.replace("/chat");
            }
        };
        checkSession();
    }, [router, supabase]);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 to-purple-600 overflow-x-hidden w-full sm:min-h-screen sm:flex sm:flex-col sm:bg-gradient-to-br sm:from-indigo-500 sm:to-purple-600 sm:overflow-x-hidden sm:w-full flex-1 p-4 overflow-y-auto space-y-4 sm:flex-none sm:p-0 sm:overflow-y-visible sm:space-y-0">
            {/* Top Navbar */}
            <div className="w-full max-w-full p-8 flex flex-col items-center sm:flex-row sm:justify-between sm:items-center px-4 sm:px-8 gap-4">
                <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold break-words text-center sm:text-left w-full sm:w-auto">
                    ✈️ Travel Assistant
                </h1>

                <div className="flex gap-4 flex-wrap justify-center w-full max-w-xs sm:justify-end">
                    <button
                        onClick={() => router.push("/login")}
                        className="flex-1 min-w-[100px] px-6 py-3 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition text-center"
                    >
                        Login
                    </button>
                    <button
                        onClick={() => router.push("/register")}
                        className="flex-1 min-w-[100px] px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:shadow-md transition text-center"
                    >
                        Sign Up
                    </button>
                </div>
            </div>

            {/* Hero Section */}
            <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 md:px-8 text-center w-full max-w-full">
                <img
                    src="/illustration-travel.png"
                    className="w-full max-w-md mb-8 mx-auto"
                />
                <h2 className="text-white text-5xl font-bold mb-6 max-w-full break-words">
                    Plan Your Perfect Journey
                </h2>

                <p className="text-white/80 text-lg max-w-2xl mb-10 px-2 sm:px-0 break-words">
                    Get personalized travel recommendations, discover hidden gems,
                    and plan unforgettable adventures with your AI travel companion.
                </p>

                <button
                    onClick={() => router.push("/register")}
                    className="px-10 py-4 bg-white text-indigo-600 rounded-xl text-lg font-semibold shadow-md hover:-translate-y-1 transition-transform min-w-[180px] max-w-full w-full sm:w-auto"
                >
                    Start Chatting
                </button>
            </div>

            {/* Footer tagline */}
            <div className="w-full p-6 text-center text-white/70 text-sm max-w-full px-4 sm:px-0">
                Your AI-powered travel companion
            </div>
        </div>
    );
}