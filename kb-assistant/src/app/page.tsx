"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-white dark:from-gray-900 dark:to-black px-6">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-white">
        Mini Knowledge-Base Assistant
      </h1>

      <p className="text-lg text-gray-600 dark:text-gray-300 mt-4 text-center max-w-xl">
        Ask travel questions using AI-powered search from curated sources.
        Register to save your chat history — or try the chat instantly!
      </p>

      <div className="mt-10 flex flex-col md:flex-row gap-4">
        <button
          onClick={() => router.push("/register")}
          className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold shadow"
        >
          Register
        </button>

        <button
          onClick={() => router.push("/login")}
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow"
        >
          Login
        </button>

        <button
          onClick={() => router.push("/chat")}
          className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-900 text-white font-semibold shadow"
        >
          Try Chat
        </button>
      </div>

      <footer className="mt-16 text-sm text-gray-500 dark:text-gray-400">
        Built with Next.js · OpenAI · Pinecone · Supabase
      </footer>
    </div>
  );
}