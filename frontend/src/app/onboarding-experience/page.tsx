'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@/analytics/client';

export default function OnboardingExperiencePage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleOptionClick = async (option: string, route: string) => {
    setIsLoading(true);
    
    // Track the onboarding option selection
    track('onboarding_experience_option_selected', {
      option: option,
      route: route,
      category: 'onboarding'
    });

    // Small delay to show loading state
    setTimeout(() => {
      router.push(route);
    }, 300);
  };

  const handleSkip = () => {
    track('onboarding_experience_skipped', {
      category: 'onboarding'
    });
    router.push('/chat');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex flex-col">
      {/* Header with X button */}
      <div className="flex justify-end p-4 sm:p-6">
        <button
          onClick={handleSkip}
          className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          disabled={isLoading}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-4xl">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <img
                src="/Jules_Logo_White_Final_NoOutline.png"
                alt="Jules"
                className="h-20 w-auto object-contain"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Welcome to Jules Dating!
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              I'm here to help you with dating advice, style tips, and more. What would you like to explore first?
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Chat with Jules */}
            <button
              onClick={() => handleOptionClick('chat', '/chat')}
              disabled={isLoading}
              className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 sm:p-8 text-left hover:bg-white/20 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                    Ask Jules
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                    Get dating advice, texting tips, style advice, and more. Ask me anything about dating and relationships.
                  </p>
                </div>
              </div>
            </button>

            {/* Profile Pics */}
            <button
              onClick={() => handleOptionClick('profile_pics', '/profile-pic-review')}
              disabled={isLoading}
              className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 sm:p-8 text-left hover:bg-white/20 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    Profile Pics
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                    Get a Pic Check and have Jules give you feedback on your dating profile pictures.
                  </p>
                </div>
              </div>
            </button>

            {/* Fit Check */}
            <button
              onClick={() => handleOptionClick('fit_check', '/fit-check')}
              disabled={isLoading}
              className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 sm:p-8 text-left hover:bg-white/20 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-green-300 transition-colors">
                    Fit Check
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                    Get feedback on your outfit. Upload a photo and I'll give you style advice for any occasion.
                  </p>
                </div>
              </div>
            </button>

            {/* Personalization */}
            <button
              onClick={() => handleOptionClick('personalization', '/settings')}
              disabled={isLoading}
              className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 sm:p-8 text-left hover:bg-white/20 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-pink-300 transition-colors">
                    Personalization
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                    Add more info in Settings to get better recommendations. Tell me about your style preferences and lifestyle.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Skip Option */}
          <div className="text-center mt-8">
            <button
              onClick={handleSkip}
              disabled={isLoading}
              className="text-gray-400 hover:text-white transition-colors text-sm underline"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}
