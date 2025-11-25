"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LogOut, Send, MessageSquare, X, Menu } from 'lucide-react';
import FormatText from './FormatText';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: { url: string, label: string }[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

export function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = searchParams.get("username") || "";
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Redirect to landing if no userId, prevent access to login/register/landing after login
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.replace('/');
    } else {
      setUserId(userId);
      fetchSessions(userId);
    }
  }, []);

  // Fetch all sessions for the user (without messages)
  const fetchSessions = async (uid: string) => {
    try {
      const res = await fetch(`/api/session?userId=${uid}`);
      const data = await res.json();
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
        const res = await fetch(`/api/chat?sessionId=${sessionId}`);
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

      console.log('data', data);
      if (data.message?.role === 'assistant') 
        assistantMessage = { 
          id: data.message.id.toString(), 
          role: 'assistant', 
          content: data.message.content,
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
  const handleLogout = () => {
    localStorage.clear();
    router.replace('/');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-indigo-600">
          {chatSessions.find(s => s.id === activeSessionId)?.title || 'New Chat'}
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-gray-700">{username}</span>
          <button onClick={handleLogout} aria-label="Logout" className="text-gray-700 hover:text-red-600 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
        {/* Sidebar toggle buttons on small screens */}
        <div className="sm:hidden bg-white border-b border-gray-200 p-2 flex justify-between items-center">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
              aria-label="Open Chats"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
              aria-label="Close Chats"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Chat session Sidebar */}
        <div className={`w-full sm:w-80 bg-white border-l border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0 sm:static fixed top-0 bottom-0 z-20`}>
          {/* Close button inside sidebar for small screens */}
          <div className="sm:hidden flex justify-end p-2">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
              aria-label="Close Chats"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-4 border-b border-gray-200 hidden sm:block">
            <button onClick={handleNewChat} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              + New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chatSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                  session.id === activeSessionId
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{session.title}</span>
              </button>
            ))}
          </div>
          {/* Add + New Chat button visible for small screens inside sidebar */}
          <div className="p-4 border-t border-gray-200 sm:hidden">
            <button onClick={handleNewChat} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              + New Chat
            </button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages / Placeholder */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-center items-center">
            {activeSessionId ? (
              chatSessions.find(s => s.id === activeSessionId)?.messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                  <div className={`max-w-full sm:max-w-2xl px-4 py-3 rounded-lg ${message.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                    <FormatText text={message.content} />
                    {message.citations && message.citations!.length > 0 && (
                      <div className="text-sm text-gray-500 mt-1">
                        <span>Sources: </span>
                        {message.citations.map((c, idx) => (
                          <span key={idx}>
                            <a href={c.url} target="_blank" rel="noreferrer" className="underline">{c.label}</a>
                            {idx < message.citations!.length - 1 && <span>, </span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center px-4 sm:px-0">
                <p className="text-lg">Hey! What travel questions can I help you with today?</p>
              </div>
            )}

            {isAssistantTyping && activeSessionId && (
              <div className="flex justify-start w-full">
                <div className="max-w-full sm:max-w-2xl px-4 py-3 rounded-lg bg-white text-gray-500 border border-gray-200 italic">
                  Assistant is typing...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <form onSubmit={handleSendMessage} className="max-w-full sm:max-w-4xl mx-auto flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a travel question..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
              />
              <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;