'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { track } from '@/analytics/client';
import BottomNavigation from '@/components/BottomNavigation';

export default function OnboardingPage() {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Track page view
    track('page_visited', {
      page: '/onboarding',
      category: 'onboarding',
      action: 'onboarding_modal_viewed'
    });
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    track('onboarding_modal_closed', {
      category: 'onboarding',
      action: 'modal_closed_with_x'
    });
    // Redirect to chat page after closing
    router.push('/chat');
  };

  const handleOptionClick = (option: string) => {
    track('onboarding_option_clicked', {
      option: option,
      category: 'onboarding',
      action: 'option_selected'
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center p-4">
      {/* Modal/Box */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full relative border border-white/20 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
          aria-label="Close"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Hey, I'm Jules!</h1>
          <p className="text-gray-300">Choose how you'd like to get started</p>
        </div>

        {/* Options Grid */}
        <div className="space-y-4">
          {/* Chat Option */}
          <Link
            href="/chat"
            onClick={() => handleOptionClick('chat')}
            className="block w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Ask Jules</h3>
                <p className="text-gray-300 text-sm">Get personalized dating advice</p>
              </div>
            </div>
          </Link>

          {/* Pic Check Option */}
          <Link
            href="/profile-pic-review"
            onClick={() => handleOptionClick('pic_check')}
            className="block w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Pic Check</h3>
                <p className="text-gray-300 text-sm">Get feedback on your photos</p>
              </div>
            </div>
          </Link>

          {/* Fit Check Option */}
          <Link
            href="/fit-check"
            onClick={() => handleOptionClick('fit_check')}
            className="block w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Fit Check</h3>
                <p className="text-gray-300 text-sm">Style and outfit advice</p>
              </div>
            </div>
          </Link>

          {/* Tips Option */}
          <Link
            href="/tips"
            onClick={() => handleOptionClick('tips')}
            className="block w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Tips</h3>
                <p className="text-gray-300 text-sm">Basic dating and profile tips</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            You can always access these options from the main menu
          </p>
        </div>
      </div>
      
      {/* Footer Navigation */}
      <BottomNavigation />
    </div>
  );
}