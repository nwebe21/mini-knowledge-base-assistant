"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Message = {
    role: "user" | "assistant";
    text: string;
    citations?: { url: string; label: string }[];
};

type HistoryItem = {
    id: string;
    question: string;
    answer: string;
    created_at: string;
};

export default function Home() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("userId");
    setUserId(storedUser);
    fetchHistory(storedUser);
  }, []);

  async function fetchHistory(currentUserId: string | null) {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/history?userId=${currentUserId}`);
      const data = await res.json();
      setHistory(data.rows || []);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage: Message = { role: "user", text: question.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setQuestion("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage.text, userId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const assistantMessage: Message = {
        role: "assistant",
        text: data.answer,
        citations: data.citations || [],
      };
      setMessages((prev) => [...prev, assistantMessage]);
      fetchHistory(userId);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error: " + err.message },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function handleScrape() {
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      const data = await res.json();
      alert("Scrape finished: " + JSON.stringify(data.upserts || data));
    } catch (err: any) {
      alert("Scrape failed: " + err.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem("userId");
    setUserId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-zinc-50 dark:bg-black p-6 font-sans">
      {/* HEADER */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Sherman Travel Knowledge Base
        </h1>
        {userId ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Logged in as: <strong>{userId}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col md:flex-row w-full max-w-5xl gap-6">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Chat
            </h2>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleScrape}
            >
              Run Scrape
            </button>
          </div>
          <div className="flex-1 border rounded p-4 bg-white dark:bg-gray-900 overflow-y-auto max-h-[500px]">
            {messages.length === 0 && (
              <p className="text-gray-500">
                Ask about Alaska, Caribbean & Bahamas, Hawaiian Islands, or
                Northern Europe.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className="mb-4">
                <div className="font-semibold">
                  {m.role === "user" ? "You" : "Assistant"}
                </div>
                <div className="whitespace-pre-wrap">{m.text}</div>
                {m.citations && m.citations.length > 0 && (
                  <ul className="text-sm text-gray-500 mt-1">
                    {m.citations.map((c, idx) => (
                      <li key={idx}>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          {c.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {loading && <div>Generating answer...</div>}
          </div>
          <form className="flex mt-2 gap-2" onSubmit={handleSend}>
            <input
              ref={inputRef}
              className="flex-1 border rounded px-3 py-2 dark:bg-gray-800 dark:text-white"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Ask
            </button>
          </form>
        </div>

        {/* History Section */}
        <div className="w-full md:w-72 flex flex-col">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
            Recent Chats
          </h2>
          <div className="flex-1 border rounded p-2 bg-white dark:bg-gray-900 overflow-y-auto max-h-[500px]">
            {history.map((h) => (
              <div
                key={h.id}
                className="mb-3 p-2 border-b border-gray-200 dark:border-gray-700"
              >
                <div className="text-xs text-gray-500">
                  {new Date(h.created_at).toLocaleString()}
                </div>
                <div className="font-semibold">{h.question}</div>
                <div className="text-sm">
                  {h.answer.slice(0, 120)}
                  {h.answer.length > 120 ? "..." : ""}
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-gray-500 text-sm">No chats yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}