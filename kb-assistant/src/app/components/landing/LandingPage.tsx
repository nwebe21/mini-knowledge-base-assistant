"use client";

import { Plane } from 'lucide-react';

interface LandingPageProps {
    onLogin: () => void;
    onRegister: () => void;
}

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
                <div className="flex items-center justify-center mb-6">
                    <Plane className="w-12 h-12 text-indigo-600 mr-3" />
                    <h1 className="text-indigo-600">Travel Assist</h1>
                </div>
                
                <p className="text-gray-700 text-center mb-8 max-w-lg mx-auto">
                    Plan smarter and explore better with AI-powered answers from trusted travel guides. Ask about destinations, cruises, or itineraries, and get responses backed by real travel sources. Register to save your chat history and keep all your travel insights in one place.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={onRegister}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Register
                    </button>
                    <button
                        onClick={onLogin}
                        className="px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
}