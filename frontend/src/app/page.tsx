'use client';

import Link from 'next/link';
import { track } from '@/analytics/client';
import MeetJulesCarousel from '@/components/MeetJulesCarousel';

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      {/* Hero Section - Optimized for mobile */}
      <section className="flex items-center justify-center px-4 py-6 sm:px-6 sm:py-12 min-h-[80vh] sm:min-h-[85vh]">
        <div className="text-center text-white max-w-4xl mx-auto w-full">
          <div className="mb-6 sm:mb-12">
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="text-center max-w-full -ml-3 sm:-ml-6 md:-ml-8">
                <div className="text-xs sm:text-base text-gray-400 mb-2 font-medium">beta</div>
                <img
                  src="/Jules_Logo_White_Final_NoOutline.png"
                  alt="Jules"
                  className="h-12 w-auto sm:h-24 md:h-32 logo-mobile sm:logo-tablet md:logo-desktop"
                />
              </div>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-300 mb-4 sm:mb-6 md:mb-8">
              Better first impressions. More dates.
            </p>
          </div>

          <div className="mb-6 sm:mb-8 md:mb-12">
            <p className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto px-2 sm:px-4">
              Honest feedback on pics, fits, and texts, so you actually get noticed
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 md:mb-12">
            <div className="flex flex-col space-y-3 sm:space-y-4 justify-center">
                      <Link
                        href="/free-experience"
                        onClick={() => track('landing_page_cta_clicked', {
                          cta_type: 'meet_jules',
                          source: 'landing_page',
                          button_text: 'Get FREE Profile Pic Review'
                        })}
                        className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base md:text-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        Get FREE Profile Pic Review
                      </Link>
              <div className="text-xs sm:text-sm text-gray-400">
                <Link href="/login" className="text-purple-300 hover:text-purple-200 underline">
                  Already signed up? Log-in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Semi-transparent separator line */}
      <div className="w-full h-px bg-white/20 mx-auto max-w-4xl"></div>

      {/* How Jules Works Section - Mobile optimized */}
      <section className="py-6 sm:py-8 md:py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              How Jules Works
            </h2>
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-blue-300">
              From Profile Pics to Dating Success
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="bg-gradient-to-br from-pink-500/20 to-purple-600/20 backdrop-blur-sm rounded-lg p-4 sm:p-6 md:p-8 border border-pink-500/30 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 bg-pink-500/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-pink-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 text-blue-300">Chat</h4>
              <p className="text-gray-300 text-xs sm:text-sm md:text-base">Get dating advice and relationship guidance from Jules, your confident wingwoman</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-600/20 backdrop-blur-sm rounded-lg p-4 sm:p-6 md:p-8 border border-purple-500/30 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 bg-purple-500/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 text-purple-300">Profile Pic Review</h4>
              <p className="text-gray-300 text-xs sm:text-sm md:text-base">Upload your profile picture and get honest feedback on lighting, grooming, and appeal.</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-sm rounded-lg p-4 sm:p-6 md:p-8 border border-blue-500/30 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 bg-blue-500/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 text-blue-300">Fit Check</h4>
              <p className="text-gray-300 text-xs sm:text-sm md:text-base">Get outfit advice for dates and special occasions from Jules.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Meet Jules Carousel Section */}
      <MeetJulesCarousel />

      {/* Why Jules Works Section - Mobile optimized */}
      <section className="py-6 sm:py-8 md:py-12 px-4 sm:px-6 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Why Jules Works
            </h2>
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-blue-300">
              The Only Stylist Trained by Experts
            </h3>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 sm:p-8 md:p-12 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-12">
              <div className="text-center">
                <h4 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4 text-blue-300">Built by Professionals</h4>
                <p className="text-gray-300 text-xs sm:text-sm md:text-base">Created with input from men and women who know the challenges of style and confidence.</p>
              </div>
              
              <div className="text-center">
                <h4 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4 text-purple-300">Informed by Psychology</h4>
                <p className="text-gray-300 text-xs sm:text-sm md:text-base">Backed by clinical insight into what actually builds self-esteem.</p>
              </div>
              
              <div className="text-center">
                <h4 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4 text-blue-300">Styled by Experts</h4>
                <p className="text-gray-300 text-xs sm:text-sm md:text-base">Years of real stylist experience baked in.</p>
              </div>

              <div className="text-center">
                <h4 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4 text-indigo-300">Proprietary Training</h4>
                <p className="text-gray-300 text-xs sm:text-sm md:text-base">A unique dataset built by Jules Labs and you. Jules learns from your preferences, style, and feedback, so every session feels more personal.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing Section - Mobile optimized */}
      <section className="py-6 sm:py-8 md:py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 sm:mb-8">
            Look Sharp. Feel Confident. Date Who You Are.
          </h2>
                  <Link
                    href="/free-experience"
                    className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base md:text-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Get FREE Profile Pic Review
                  </Link>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="py-6 sm:py-8 px-4 sm:px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-4 text-sm text-gray-300">
            Jules is an AI tool. Her guidance is for informational purposes only and should not replace professional advice. Use your own judgment before making decisions.
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-400">
            <Link 
              href="https://www.juleslabs.com/privacy" 
              className="hover:text-white transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <span className="hidden sm:inline text-gray-500">•</span>
            <Link 
              href="https://www.juleslabs.com/terms" 
              className="hover:text-white transition-colors duration-200"
            >
              Terms of Use
            </Link>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            © 2025 Jules Labs. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}  