"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import FormatText from "./FormatText";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: { url: string, label: string }[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

export default function ChatPage() {
    const router = useRouter();
    const { user } = useUser();
    const supabase = getSupabaseBrowserClient();
    const fullname = user?.fullname || "";
    const userId = user?.id || "";
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isAssistantTyping, setIsAssistantTyping] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/");
      }
    };
    verifySession();
  }, [router, supabase]);

  useEffect(() => {
    if (!user) return; // wait for user context to load
    fetchSessions();
  }, [user]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    const container = messagesEndRef.current;

    // Scroll to bottom smoothly
    container.scrollTop = container.scrollHeight;
  }, [chatSessions, isAssistantTyping]);

  // Fetch all sessions for the user (without messages)
  const fetchSessions = async () => {
    try {
      console.log('nisulod here');
      const res = await fetch(`/api/session?userId=${userId}`);
      const data = await res.json();
      console.log('data sessions', data)
      if (data.sessions) {
        const sessions: ChatSession[] = data.sessions.map((session: any) => ({
          id: session.id,
          title: session.title,
          messages: [] // messages will be lazy-loaded per session
        }));
        setChatSessions(sessions);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  // Fetch messages for a given session
  const fetchMessages = async (sessionId: string) => {
    if (!userId) return;

    try {
      if (sessionId) {
        const res = await fetch(`/api/chat?userId=${userId}&sessionId=${sessionId}`);
        const data = await res.json();
        const messages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          citations: msg.sources ? msg.sources.map((url: string, i: number) => ({ url, label: `Source ${i+1}` })) : undefined
        }));
        setChatSessions(prev =>
          prev.map(session =>
            session.id === sessionId ? { ...session, messages } : session
          )
        );
      }
    } catch (err) {
      console.error("Failed to fetch messages for session", err);
    }
  };

  // Create a new chat session
  const handleNewChat = async () => {
    if (!userId) return;
    setActiveSessionId(null);
    setIsSidebarOpen(false);
  };

  // Send a message (and create session if none active)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !userId) return;

    try {
      let currrentSessionId = activeSessionId;
      const firstMessage = inputValue.trim();

      // Immediately show the user message and clear input
      const tempUserMessage: Message = {
        id: Date.now().toString(),
        timestamp: Date.now().toString(),
        role: "user",
        content: firstMessage
      };

      // if new session, upload the session to database
      if (!currrentSessionId) {
        const resCreate = await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              sessionTitle: firstMessage
            }),
          });

          const createData = await resCreate.json();
          currrentSessionId = createData.sessionId;
          setActiveSessionId(currrentSessionId);
          setChatSessions((prev: any[]) => [
            ...prev,
            { id: currrentSessionId, title: firstMessage, messages: [tempUserMessage] }
          ]);
      } else {
        setChatSessions(prev =>
          prev.map(session =>
            session.id === currrentSessionId
              ? { ...session, messages: [...session.messages, tempUserMessage] }
              : session
          )
        );
      }

      setInputValue('');
      setIsAssistantTyping(true);

      // Send the message
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: firstMessage,
          userId,
          sessionId: currrentSessionId
        }),
      });

      const data = await res.json();
      let assistantMessage: Message;

      if (data.message?.role === 'assistant') 
        assistantMessage = { 
          id: data.message.id.toString(), 
          role: 'assistant', 
          content: data.message.content,
          timestamp: data.message.created_at,
          citations: data.message.sources ? data.message.sources.map((url: string, i: number) => ({ url, label: `Source ${i+1}` })) : undefined
        };

      setChatSessions(prev =>
        prev.map(session =>
          session.id === currrentSessionId
            ? { ...session, messages: [...session.messages, assistantMessage] }
            : session
        )
      );

      setIsAssistantTyping(false);
    } catch (error) {
      console.error("Session/message failed:", error);
      setIsAssistantTyping(false);
    }
  };

  // Select session in sidebar
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    fetchMessages(sessionId);
    setIsSidebarOpen(false);
  };

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  async function handleDeleteSession(toDeleteSessionId?: string) {      
      if (!toDeleteSessionId || !userId) return;

      await fetch("/api/session", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: toDeleteSessionId, userId })
      });

      setChatSessions(prev => prev.filter((session: any) => session.id !== toDeleteSessionId));
      setActiveSessionId(null);
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="relative flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar for md and above */}
      <div className="hidden md:flex w-72 bg-white border-r border-gray-200 flex-col">
        {/* User Profile */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {getInitials(fullname)}
            </div>
            <div className="flex-1">
              <div className="text-gray-900 font-semibold text-sm">{fullname}</div>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 transition"
          >
            <span className="text-lg">+</span> New Chat
          </button>
        </div>
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-gray-500 text-xs font-semibold uppercase mb-2">Chat History</div>
          {chatSessions.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-6">
              No chat history yet. Start a new conversation!
            </div>
          ) : (
            chatSessions.map((session) => (
              <div
                key={session.id}
                className={`p-3 rounded cursor-pointer mb-2 flex items-center justify-between ${
                  activeSessionId === session.id
                    ? "bg-indigo-100 border-l-4 border-indigo-600"
                    : "hover:bg-indigo-50"
                }`}
              >
                <div
                  className="flex-1 truncate"
                  onClick={() => handleSelectSession(session.id)}
                >
                  <div className="font-medium text-gray-900 truncate">{session.title}</div>
                </div>
                <button
                  className="ml-3 text-gray-400 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id)
                  }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2 rounded font-semibold hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Sidebar for sm and below - overlay and sliding panel */}
      {/* Responsive overlay sidebar: overlays the chat area but not the header/input */}
      {/* We use a portal-style approach, but render in flow for simplicity */}
      <div
        className={`md:hidden fixed inset-0 z-40 pointer-events-none transition duration-300 ${
          isSidebarOpen ? "block" : "hidden"
        }`}
        aria-hidden={!isSidebarOpen}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-transparent pointer-events-auto"
          onClick={() => setIsSidebarOpen(false)}
        />
        {/* Sidebar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-72 max-w-full bg-white border-r border-gray-200 flex flex-col shadow-lg z-50 pointer-events-auto transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ height: '100%' }}
        >
          {/* User Profile */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {getInitials(fullname)}
              </div>
              <div className="flex-1">
                <div className="text-gray-900 font-semibold text-sm">{fullname}</div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close sidebar"
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                ✕
              </button>
            </div>
            <button
              onClick={() => {
                handleNewChat();
                setIsSidebarOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 transition"
            >
              <span className="text-lg">+</span> New Chat
            </button>
          </div>
          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-gray-500 text-xs font-semibold uppercase mb-2">Chat History</div>
            {chatSessions.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-6">
                No chat history yet. Start a new conversation!
              </div>
            ) : (
              chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded cursor-pointer mb-2 flex items-center justify-between ${
                    activeSessionId === session.id
                      ? "bg-indigo-100 border-l-4 border-indigo-600"
                      : "hover:bg-indigo-50"
                  }`}
                >
                  <div
                    className="flex-1 truncate"
                    onClick={() => {
                      handleSelectSession(session.id);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <div className="font-medium text-gray-900 truncate">{session.title}</div>
                  </div>
                  <button
                    className="ml-3 text-gray-400 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id)
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                handleLogout();
                setIsSidebarOpen(false);
              }}
              className="w-full bg-red-500 text-white py-2 rounded font-semibold hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="bg-white flex justify-between items-center p-4 border-b border-gray-200 shadow-sm z-10">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle button for mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
              aria-label="Open sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-2xl">
              🤖
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg max-w-xs truncate">{chatSessions.find(s => s.id === activeSessionId)?.title || 'New Chat'}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span>AI Travel Assistant</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => handleDeleteSession(activeSessionId ?? undefined)}
            className="bg-red-100 text-red-600 py-1 px-2 md:px-3 rounded font-medium hover:bg-red-200 transition whitespace-nowrap text-xs md:text-sm flex items-center justify-center"
          >
            <span className="md:hidden text-lg">🗑️</span>
            <span className="hidden md:inline">Delete Chat</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4" ref={messagesEndRef}>
          { chatSessions.find(s => s.id === activeSessionId)?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3/4 ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full ${
                  msg.role === "user" ? "bg-indigo-600 text-white" : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                } font-bold`}
              >
                {msg.role === "user" ? getInitials(fullname) : "🤖"}
              </div>
              <div
                className={`p-3 rounded-xl ${
                  msg.role === "user" ? "bg-indigo-600 text-white" : "bg-white text-gray-900 shadow"
                }`}
              >
                <FormatText text={msg.content} />
                {msg.citations && msg.citations!.length > 0 && (
                  <div className="text-sm text-gray-500 mt-1">
                    <span>Sources: </span>
                    {msg.citations.map((c, idx) => (
                      <span key={idx}>
                        <a href={c.url} target="_blank" rel="noreferrer" className="underline">{c.label}</a>
                        {idx < msg.citations!.length - 1 && <span>, </span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Assistant typing indicator */}
          {isAssistantTyping && activeSessionId && (
            <div className="flex gap-3 max-w-3/4">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                🤖
              </div>
              <div className="p-3 rounded-xl bg-white text-gray-900 shadow italic text-sm">
                Assistant is typing...
              </div>
            </div>
          )}
          <div id="bottom-anchor" />
        </div>

        {/* Input */}
        <div className="bg-white p-4 border-t border-gray-200 z-10">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <textarea
              rows={1}
              maxLength={500}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault(); // prevent newline
                  handleSendMessage(e as any); // call your send function
                }
              }}
              placeholder="Ask me about your next adventure..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition whitespace-nowrap"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}