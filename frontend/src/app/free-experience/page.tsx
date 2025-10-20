'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { segment } from '@/utils/segment';
import MeetJulesCarousel from '@/components/MeetJulesCarousel';

export default function FreeExperiencePage() {
  // Free experience landing page
  useEffect(() => {
    // Track page view
    segment.track('Page Visited', {
      page: '/free-experience',
      category: 'free_experience',
      action: 'landing_page_visited'
    });
    
    // Track landing page session
    segment.track('Landing Page Session', {
      page: '/free-experience',
      category: 'free_experience',
      action: 'landing_page_session_started'
    });
  }, []);

  const handleCTAClick = (ctaType: string, source: string) => {
    // Map ctaType to the correct button text
    const buttonTextMap: { [key: string]: string } = {
      'try_free_fit_check': 'Try Free Fit Check',
      'get_fit_check': 'Try Free Fit Check',
      'get_started_free': 'Get Started for Free',
      'join_jules_beta': 'Get Started for Free'
    };
    
    segment.track('Landing Page CTA Clicked', {
      cta_type: ctaType,
      source: source,
      category: 'free_experience',
      action: 'cta_button_clicked',
      button_text: buttonTextMap[ctaType] || 'Unknown Button'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      {/* 1. Hero Section */}
      <section className="flex items-center justify-center px-4 py-6 sm:px-6 sm:py-12 min-h-[80vh] sm:min-h-[85vh]">
        <div className="text-center text-white max-w-4xl mx-auto w-full">
          {/* Logo */}
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-center mb-2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                BETA
              </span>
            </div>
            <div className="flex justify-center mb-6 sm:mb-8">
              <img
                src="/Jules_Logo_White_Final_NoOutline.png"
                alt="Jules"
                className="h-28 w-auto sm:h-42 md:h-56"
              />
            </div>
            
            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
              Better first impressions. More dates.
            </h1>
            
            {/* Subhead */}
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto px-2 sm:px-4">
              Honest feedback on pics, fits, and texts, so you actually get noticed
            </p>
          </div>

          {/* CTA Button */}
          <div className="mb-8 sm:mb-12">
            <Link
              href="/free-experience/profile-pic-review"
              onClick={() => handleCTAClick('try_free_profile_pic_review', 'hero_section')}
              className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-full text-base sm:text-lg md:text-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Get FREE Profile Pic Review
            </Link>
          </div>

          {/* Visual - Phone Mockup */}
          <div className="flex justify-center">
            <div className="relative w-64 sm:w-80 md:w-96">
              <div className="rounded-[1.5rem] overflow-hidden border border-white/60">
                <Image
                  src="/Hero_Shot.png"
                  alt="Jules giving feedback on a profile picture"
                  width={400}
                  height={800}
                  className="object-cover w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Moments that Matter Text */}
          <div className="mt-8 sm:mt-12 text-center">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-4 sm:mb-6">
              Built for Dating Success
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center">
                <div className="w-8 h-8 mx-auto mb-4 text-blue-400">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                  </svg>
                </div>
                <p className="text-white text-sm sm:text-base mb-3 italic">"It's working! I ended up changing my outfit Fri and Sat night based on Jules recommendations"</p>
                <p className="text-gray-400 text-xs">Anonymous, 25, San Francisco</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center">
                <div className="w-8 h-8 mx-auto mb-4 text-blue-400">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                  </svg>
                </div>
                <p className="text-white text-sm sm:text-base mb-3 italic">"This is the kind of feedback I wish my friends would give me."</p>
                <p className="text-gray-400 text-xs">Jake R, 32, Portland</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center">
                <div className="w-8 h-8 mx-auto mb-4 text-blue-400">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                  </svg>
                </div>
                <p className="text-white text-sm sm:text-base mb-3 italic">"First time I've felt confident in what I'm putting out there. Jules is legit."</p>
                <p className="text-gray-400 text-xs">John, 32, NYC</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Semi-transparent separator line */}
      <div className="w-full h-px bg-white/20 mx-auto max-w-4xl"></div>

      {/* 2. How Jules Works Section */}
      <section className="py-6 sm:py-8 md:py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              How Jules Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="bg-gradient-to-br from-pink-500/20 to-purple-600/20 backdrop-blur-sm rounded-lg p-4 sm:p-6 md:p-8 border border-pink-500/30 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 bg-pink-500/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-pink-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 text-blue-300">Ask Jules</h4>
              <p className="text-gray-300 text-xs sm:text-sm md:text-base">Jules will give you dating advice, profile feedback, outfit advice, picture feedback, and more.</p>
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

      {/* 3. Screenshots / Jules in Action */}
      <MeetJulesCarousel />

      {/* Semi-transparent separator line */}
      <div className="w-full h-px bg-white/20 mx-auto max-w-4xl"></div>


      {/* 4. Try for Free Section */}
      <section className="py-6 sm:py-8 md:py-12 px-4 sm:px-6 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Try for Free
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto">
            Jules is currently in Beta. Creating an account and using Jules is currently <span className="font-bold text-white">FREE</span> to all users. We will just ask for some feedback to help improve the experience.
          </p>
          
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Free Card - Highlighted */}
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-lg p-6 sm:p-8 border-2 border-blue-500/50 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Start Here
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Profile Pic Review
              </h3>
              <p className="text-gray-300 mb-6">
                Start with one free Profile Pic Review! Unlock Chat and Fit Check when you join Jules Dating (free while in beta).
              </p>
                      <Link
                        href="/free-experience/profile-pic-review"
                        onClick={() => handleCTAClick('get_profile_pic_review', 'free_card')}
                        className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-full text-base font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg w-full"
                      >
                        Get FREE Profile Pic Review
                      </Link>
            </div>

            {/* Premium Card */}
            <div className="bg-gradient-to-br from-gray-700/20 to-gray-800/20 backdrop-blur-sm rounded-lg p-6 sm:p-8 border border-gray-600/30">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Premium
              </h3>
              <p className="text-gray-300 mb-6">
                Unlock Chat and Fit Check when you join Jules Dating (free while in beta).
              </p>
              <Link
                href="/register"
                onClick={() => handleCTAClick('get_started_free', 'premium_card')}
                className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-full text-base font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg w-full"
              >
                Get Started for Free
              </Link>
              <p className="text-sm text-gray-400 mt-2">
                Join Jules Dating
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Semi-transparent separator line */}
      <div className="w-full h-px bg-white/20 mx-auto max-w-4xl"></div>

      {/* 5. Why Jules (3 Value Props) */}
      <section className="py-6 sm:py-8 md:py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Built by Stylists */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">Built by Experts</h3>
              <p className="text-gray-300 text-base sm:text-lg">
                Created with input from professionals in the field who know the challenges of dating, style, and confidence.
              </p>
            </div>
            
            {/* Psychology-Informed */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">Psychology-Informed</h3>
              <p className="text-gray-300 text-base sm:text-lg">
                Confidence backed by science and clinical outcomes
              </p>
            </div>
            
            {/* Instant Feedback */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-indigo-500/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">Instant Feedback</h3>
              <p className="text-gray-300 text-base sm:text-lg">
                Immediate, actionable advice whenever you need it
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Semi-transparent separator line */}
      <div className="w-full h-px bg-white/20 mx-auto max-w-4xl"></div>

      {/* 6. Final CTA */}
      <section className="py-6 sm:py-8 md:py-12 px-4 sm:px-6 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12">
            Help craft the future of dating success
          </p>
          <div className="max-w-md mx-auto">
            <Link
              href="/register"
              onClick={() => handleCTAClick('join_jules_dating', 'final_cta')}
              className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-full text-base sm:text-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg w-full"
            >
              Join Jules Beta FREE
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
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