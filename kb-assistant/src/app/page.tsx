"use client";
import { useState, useEffect } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './components/login/LoginPage';
import { RegisterPage } from './components/register/RegisterPage';
import { ChatPage } from './components/chat/ChatPage';

type Page = 'landing' | 'login' | 'register' | 'chat';

interface User {
  username: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);

  // 🔥 Restore session on refresh
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');

    if (storedUserId && storedUsername) {
      setUser({ username: storedUsername });
      setCurrentPage('chat');
    }
  }, []);

  const handleLogin = (username: string) => {
    localStorage.setItem("username", username);
    setUser({ username });
    setCurrentPage('chat');
  };

  const handleRegister = (username: string) => {
    localStorage.setItem("username", username);
    setUser({ username });
    setCurrentPage('chat');
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setCurrentPage('landing');
  };

  return (
    <div className="min-h-screen">
      {currentPage === 'landing' && (
        <LandingPage
          onLogin={() => setCurrentPage('login')}
          onRegister={() => setCurrentPage('register')}
        />
      )}
      {currentPage === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          onBack={() => setCurrentPage('landing')}
        />
      )}
      {currentPage === 'register' && (
        <RegisterPage
          onRegister={handleRegister}
          onBack={() => setCurrentPage('landing')}
        />
      )}
      {currentPage === 'chat' && user && (
        <ChatPage
          username={user.username}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
