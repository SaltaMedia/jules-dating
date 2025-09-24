'use client';

import { useState, useEffect } from 'react';

export default function TestTokenPage() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');

  const handleSetToken = () => {
    if (token.trim()) {
      localStorage.setItem('token', token.trim());
      setCurrentToken(token.trim());
      setMessage('Token set successfully! You can now navigate to /settings');
    } else {
      setMessage('Please enter a valid token');
    }
  };

  const handleClearToken = () => {
    localStorage.removeItem('token');
    setCurrentToken(null);
    setMessage('Token cleared');
  };

  const [currentToken, setCurrentToken] = useState<string | null>(null);

  // Use useEffect to avoid hydration mismatch
  useEffect(() => {
    setCurrentToken(localStorage.getItem('token'));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6">Test Token Setup</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              JWT Token
            </label>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your JWT token here..."
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical"
              rows={4}
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleSetToken}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              Set Token
            </button>
            <button
              onClick={handleClearToken}
              className="flex-1 bg-white/20 text-white px-4 py-3 rounded-lg font-semibold hover:bg-white/30 transition-all duration-200"
            >
              Clear Token
            </button>
          </div>

          {message && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg text-white text-sm">
              {message}
            </div>
          )}

          {currentToken && (
            <div className="mt-4 p-3 bg-green-500/20 rounded-lg text-green-300 text-sm">
              Token is set: {currentToken.substring(0, 20)}...
            </div>
          )}

          <div className="mt-6 text-white text-sm">
            <p className="mb-2">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-300">
              <li>Paste your JWT token above</li>
              <li>Click "Set Token"</li>
              <li>Navigate to <a href="/settings" className="text-purple-300 hover:underline">/settings</a></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
